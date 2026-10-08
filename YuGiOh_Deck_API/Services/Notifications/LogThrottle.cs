namespace YuGiOhDeckApi.Notifications
{
    // Says each problem once, then stays quiet about it for a while, so a broken connection that
    // fails every few seconds does not bury the log under thousands of identical lines.
    // Think of it as a field spell that only lets the same effect activate once per "quiet period".
    public sealed class LogThrottle
    {
        private sealed class Entry
        {
            public DateTime LastLoggedUtc;
            public int Suppressed;
        }

        private readonly TimeSpan _quietPeriod;
        private readonly object _lock = new();
        private readonly Dictionary<string, Entry> _seen = new();

        public LogThrottle(TimeSpan quietPeriod) => _quietPeriod = quietPeriod;

        // True = go ahead and log it. suppressedSinceLast = how many identical reports were hidden since the last time it was logged.
        public bool ShouldLog(string key, out int suppressedSinceLast)
        {
            lock (_lock)
            {
                var now = DateTime.UtcNow;

                if (!_seen.TryGetValue(key, out var entry))
                {
                    if (_seen.Count >= 100) _seen.Clear();   // safety net: never grow without limit
                    _seen[key] = new Entry { LastLoggedUtc = now };
                    suppressedSinceLast = 0;
                    return true;
                }

                if (now - entry.LastLoggedUtc >= _quietPeriod)
                {
                    suppressedSinceLast = entry.Suppressed;
                    entry.LastLoggedUtc = now;
                    entry.Suppressed = 0;
                    return true;
                }

                entry.Suppressed++;
                suppressedSinceLast = 0;
                return false;
            }
        }

        // Call when things are healthy again. Returns how many repeats were hidden, or -1 if there was nothing to clear.
        public int Clear()
        {
            lock (_lock)
            {
                if (_seen.Count == 0) return -1;
                var hidden = _seen.Values.Sum(e => e.Suppressed);
                _seen.Clear();
                return hidden;
            }
        }
    }
}