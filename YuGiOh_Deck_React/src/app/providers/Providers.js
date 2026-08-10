'use client'; // 👈 Must be a Client Component to hold React context providers

import React, { useState } from 'react';
import { Provider } from 'react-redux'; // ⚡ Import Redux Provider
import { store } from '@/store/store';
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DecksProvider } from '@/components/DecksContext';
import { SignalRProvider } from '@/components/SignalRContext';
import GlobalToast from '@/components/GlobalToast';

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <Sentry.ErrorBoundary fallback={
      <div className="md-theme-bg min-vh-100 d-flex flex-column justify-content-center align-items-center text-center p-5">
        <h3 className="text-danger terminal-font">SYSTEM_CRASH_DETECTED</h3>
        <p className="text-white-50">An unexpected system exception occurred.</p>
        <button className="md-btn-primary mt-3" onClick={() => window.location.href = '/'}>
          REBOOT_SYSTEM
        </button>
      </div>
    }>
      {/* ⚡ Redux Store MUST wrap all children */}
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SignalRProvider>
            <DecksProvider>
              <GlobalToast />
              {children}
            </DecksProvider>
          </SignalRProvider>
        </QueryClientProvider>
      </Provider>
    </Sentry.ErrorBoundary>
  );
}