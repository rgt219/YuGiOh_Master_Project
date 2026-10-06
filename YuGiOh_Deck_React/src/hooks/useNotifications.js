import { useEffect, useSyncExternalStore } from 'react';
import * as signalR from '@microsoft/signalr';
import { createNotificationStore } from '@/lib/notificationStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

// The REST endpoints live under /api, but the SignalR hub is mapped at the root: /notificationHub.
const HUB_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/notificationHub`;

const RETRY_DELAY_MS = 10_000;
const MAX_START_ATTEMPTS = 5;

const getToken = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage.getItem('token') : null; }
  catch { return null; }
};

// One store for the whole site, so the bell and the toast always agree.
const store = createNotificationStore({ apiBase: API_BASE_URL, getToken });

/**
 * const { items, unread, latest, status, error, markRead, markAllRead, dismissLatest } = useNotifications(userKey);
 *
 * `userKey` is anything that identifies the logged-in user (their name or id), or null when logged out.
 * It is what tells the hook to connect when someone logs in, and to disconnect when they log out or someone else logs in.
 * Call this hook from ONE place (the bell in the navbar), because it also owns the live connection.
 */
export function useNotifications(userKey) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  useEffect(() => {
    // Download the list (or clear it, when logged out). Safe to call every time.
    store.ensureLoaded();
    if (!userKey) return undefined;

    let cancelled = false;
    let retryTimer = null;

    // The browser can't put an Authorization header on a websocket, so SignalR passes the token in the URL
    // as ?access_token=. The server accepts that for this hub only (Step 3, File 5).
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => getToken() || '' })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // "ReceiveNotification" must match SignalRNotificationPusher.EventName on the server.
    connection.on('ReceiveNotification', (notification) => store.receive(notification));

    // Anything pushed while we were disconnected is gone from the live channel, but it was saved in the database.
    connection.onreconnected(() => store.refresh());

    const start = async (attempt = 1) => {
      try {
        await connection.start();
        if (attempt > 1) store.refresh(); // catch up on whatever we missed while it was failing
      } catch (err) {
        if (cancelled) return;
        if (attempt >= MAX_START_ATTEMPTS) {
          console.warn('Notifications: live connection unavailable. The bell still works when the page is reloaded.', err);
          return;
        }
        // withAutomaticReconnect only helps AFTER a connection has worked once, so retry the first connection ourselves.
        retryTimer = setTimeout(() => start(attempt + 1), RETRY_DELAY_MS);
      }
    };
    start();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      connection.stop().catch(() => {});
    };
  }, [userKey]);

  return {
    items: state.items,
    unread: state.unread,
    latest: state.latest,
    status: state.status,
    error: state.error,
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    dismissLatest: store.dismissLatest,
  };
}