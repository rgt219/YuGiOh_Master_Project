using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace YuGiOh.ServiceDefaults
{
    // Every service exposes the same three health endpoints:
    //
    //   /health/live   Is the process running? No outside calls. Azure's liveness probe: a failure restarts the replica.
    //   /health/ready  Can it take traffic (started, not shutting down)? No outside calls. Azure's readiness probe.
    //   /health        Every dependency checked (MongoDB, Kafka, Redis, ...), as JSON. Used by the site's /status page
    //                  and the deploy smoke test. Never by probes.
    //
    // Probes fire every few seconds, so they must not touch the database: on Cosmos DB every call costs request units,
    // and a short database blip would mark every replica unready at once, taking the whole site down instead of
    // letting it limp along. The full check only runs when someone asks, and its result is reused for 10 seconds.
    //
    // A failing dependency marked critical (the database) makes the service Unhealthy (HTTP 503). Anything else
    // (cache, Kafka, the Go worker) only makes it Degraded (HTTP 200): the service still works, just not fully.
    public static class ServiceHealth
    {
        public const string CriticalTag = "critical";

        private static readonly TimeSpan CheckTimeout = TimeSpan.FromSeconds(5);

        public static IHealthChecksBuilder AddServiceHealthChecks(this IHostApplicationBuilder builder)
        {
            builder.Services.TryAddSingleton(TimeProvider.System);
            builder.Services.TryAddSingleton<HealthReportCache>();
            builder.Services.AddHttpClient();
            return builder.Services.AddHealthChecks();
        }

        // Pings MongoDB / Cosmos DB. The first configuration key that has a value is used.
        public static IHealthChecksBuilder AddMongoCheck(this IHealthChecksBuilder builder, params string[] connectionStringKeys) =>
            builder.Add(Registration("mongodb", critical: true,
                sp => new MongoHealthCheck(sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>(), connectionStringKeys)));

        // Asks the Kafka broker (Event Hubs in Azure) for its metadata.
        public static IHealthChecksBuilder AddKafkaCheck(this IHealthChecksBuilder builder) =>
            builder.Add(Registration("kafka", critical: false,
                sp => new KafkaHealthCheck(sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>())));

        // Reads one key from the distributed cache (Redis).
        public static IHealthChecksBuilder AddCacheCheck(this IHealthChecksBuilder builder, string name = "redis") =>
            builder.Add(Registration(name, critical: false,
                sp => new DistributedCacheHealthCheck(sp.GetRequiredService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>())));

        // Calls another service's /health/live (e.g. the Go worker).
        public static IHealthChecksBuilder AddHttpCheck(this IHealthChecksBuilder builder, string name, string? baseUrl) =>
            builder.Add(Registration(name, critical: false,
                sp => new HttpHealthCheck(sp.GetRequiredService<IHttpClientFactory>(), baseUrl)));

        public static WebApplication MapServiceHealthChecks(this WebApplication app)
        {
            app.MapGet("/health/live", () => Results.Text("Alive")).ExcludeFromDescription();

            app.MapGet("/health/ready", (IHostApplicationLifetime lifetime) =>
                    lifetime.ApplicationStopping.IsCancellationRequested
                        ? Results.Text("Stopping", statusCode: StatusCodes.Status503ServiceUnavailable)
                        : Results.Text("Ready"))
                .ExcludeFromDescription();

            app.MapGet("/health", async (HttpContext http, HealthReportCache cache) =>
                {
                    var (report, checkedAt) = await cache.GetAsync();
                    http.Response.Headers.CacheControl = "no-store";
                    return Results.Json(HealthView.From(report, checkedAt),
                        statusCode: report.Status == HealthStatus.Unhealthy
                            ? StatusCodes.Status503ServiceUnavailable
                            : StatusCodes.Status200OK);
                })
                .ExcludeFromDescription();

            return app;
        }

        private static HealthCheckRegistration Registration(string name, bool critical, Func<IServiceProvider, IHealthCheck> factory) =>
            new(name, factory,
                failureStatus: critical ? HealthStatus.Unhealthy : HealthStatus.Degraded,
                tags: critical ? new[] { CriticalTag } : Array.Empty<string>(),
                timeout: CheckTimeout);
    }

    // Runs the full check at most once every 10 seconds, however many people refresh the status page.
    public sealed class HealthReportCache
    {
        public static readonly TimeSpan CacheFor = TimeSpan.FromSeconds(10);

        private readonly HealthCheckService _health;
        private readonly TimeProvider _time;
        private readonly SemaphoreSlim _gate = new(1, 1);
        private HealthReport? _report;
        private DateTimeOffset _checkedAt;

        public HealthReportCache(HealthCheckService health, TimeProvider time)
        {
            _health = health;
            _time = time;
        }

        public async Task<(HealthReport Report, DateTimeOffset CheckedAt)> GetAsync()
        {
            if (IsFresh()) return (_report!, _checkedAt);

            await _gate.WaitAsync();
            try
            {
                if (IsFresh()) return (_report!, _checkedAt);   // someone else refreshed it while we waited

                // Not tied to the caller's request: a visitor closing the tab must not cancel a check others will reuse.
                _report = await _health.CheckHealthAsync(CancellationToken.None);
                _checkedAt = _time.GetUtcNow();
                return (_report, _checkedAt);
            }
            finally
            {
                _gate.Release();
            }
        }

        private bool IsFresh() => _report != null && _time.GetUtcNow() - _checkedAt < CacheFor;
    }

    // The only descriptions /health will show. Anything else (a check that threw puts its exception message here,
    // which can contain host names or connection details) is replaced, so it stays in the logs and off the public page.
    public static class HealthDescriptions
    {
        public const string Reachable = "reachable";
        public const string NotReachable = "not reachable";
        public const string NotConfigured = "not configured";
        public const string TimedOut = "timed out";
        public const string CheckFailed = "check failed";

        private static readonly HashSet<string> Safe = new() { Reachable, NotReachable, NotConfigured, TimedOut, CheckFailed };

        public static string? ForDisplay(HealthReportEntry entry)
        {
            if (entry.Description != null && Safe.Contains(entry.Description)) return entry.Description;
            if (entry.Exception is OperationCanceledException) return TimedOut;   // the per-check 5 second limit
            return entry.Status == HealthStatus.Healthy ? null : CheckFailed;
        }
    }

    // What /health returns.
    public sealed record HealthView(string Status, DateTimeOffset CheckedAt, double DurationMs, IReadOnlyList<HealthCheckView> Checks)
    {
        public static HealthView From(HealthReport report, DateTimeOffset checkedAt) => new(
            report.Status.ToString(),
            checkedAt,
            Math.Round(report.TotalDuration.TotalMilliseconds, 1),
            report.Entries
                .Select(e => new HealthCheckView(
                    e.Key,
                    e.Value.Status.ToString(),
                    e.Value.Tags.Contains(ServiceHealth.CriticalTag),
                    Math.Round(e.Value.Duration.TotalMilliseconds, 1),
                    HealthDescriptions.ForDisplay(e.Value)))
                .ToList());
    }

    public sealed record HealthCheckView(string Name, string Status, bool Critical, double DurationMs, string? Description);
}
