using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Xunit;
using YuGiOh.ServiceDefaults;

public class ServiceHealthTests
{
    // Starts a real web app on a free port with the shared health endpoints and the given checks.
    private static async Task<(WebApplication App, HttpClient Http)> StartAsync(Action<IHealthChecksBuilder> checks,
        Dictionary<string, string?>? config = null)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Logging.ClearProviders();
        if (config != null) builder.Configuration.AddInMemoryCollection(config);
        checks(builder.AddServiceHealthChecks());

        var app = builder.Build();
        app.MapServiceHealthChecks();
        await app.StartAsync();

        var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.First();
        return (app, new HttpClient { BaseAddress = new Uri(address) });
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private static IHealthChecksBuilder Add(IHealthChecksBuilder b, string name, HealthCheckResult result, bool critical) =>
        b.Add(new HealthCheckRegistration(name, _ => new FixedCheck(result),
            critical ? HealthStatus.Unhealthy : HealthStatus.Degraded,
            critical ? new[] { ServiceHealth.CriticalTag } : null));

    private sealed class FixedCheck(HealthCheckResult result) : IHealthCheck
    {
        public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) => Task.FromResult(result);
    }

    private sealed class ThrowingCheck : IHealthCheck
    {
        public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) =>
            throw new InvalidOperationException("mongodb://admin:hunter2@prod-db:10255 refused the connection");
    }

    [Fact]
    public async Task Live_and_ready_answer_without_running_any_check()
    {
        var calls = 0;
        var (app, http) = await StartAsync(b => b.AddCheck("counted", () => { calls++; return HealthCheckResult.Unhealthy(); }));
        await using var _ = app;

        Assert.Equal(HttpStatusCode.OK, (await http.GetAsync("/health/live")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await http.GetAsync("/health/ready")).StatusCode);
        Assert.Equal(0, calls);   // probes never reach the dependency checks
    }

    [Fact]
    public async Task A_failing_optional_dependency_is_degraded_and_still_200()
    {
        var (app, http) = await StartAsync(b =>
        {
            Add(b, "mongodb", HealthCheckResult.Healthy(HealthDescriptions.Reachable), critical: true);
            Add(b, "redis", new HealthCheckResult(HealthStatus.Degraded, HealthDescriptions.NotReachable), critical: false);
        });
        await using var _ = app;

        var response = await http.GetAsync("/health");
        var body = await Json(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Degraded", body.GetProperty("status").GetString());
        var redis = body.GetProperty("checks").EnumerateArray().Single(c => c.GetProperty("name").GetString() == "redis");
        Assert.False(redis.GetProperty("critical").GetBoolean());
        Assert.Equal("not reachable", redis.GetProperty("description").GetString());
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task A_failing_critical_dependency_is_unhealthy_and_503()
    {
        var (app, http) = await StartAsync(b =>
            Add(b, "mongodb", new HealthCheckResult(HealthStatus.Unhealthy, HealthDescriptions.NotReachable), critical: true));
        await using var _ = app;

        var response = await http.GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);   // what the deploy smoke test looks for
        Assert.Equal("Unhealthy", (await Json(response)).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Exception_details_never_reach_the_response()
    {
        var (app, http) = await StartAsync(b => b.AddCheck<ThrowingCheck>("mongodb", HealthStatus.Unhealthy));
        await using var _ = app;

        var text = await (await http.GetAsync("/health")).Content.ReadAsStringAsync();

        Assert.DoesNotContain("hunter2", text);
        Assert.DoesNotContain("prod-db", text);
        Assert.Contains("check failed", text);
    }

    private static async Task<string?> MongoDescription(Dictionary<string, string?> config)
    {
        var (app, http) = await StartAsync(b => b.AddMongoCheck("Test:Mongo"), config);
        await using var _ = app;
        var check = (await Json(await http.GetAsync("/health"))).GetProperty("checks").EnumerateArray().Single();
        return check.GetProperty("description").GetString();
    }

    [Fact]
    public async Task Mongo_check_reports_a_missing_connection_string()
    {
        Assert.Equal("not configured", await MongoDescription(new()));
    }

    [Fact]
    public async Task Mongo_check_reports_a_database_that_does_not_answer()
    {
        var description = await MongoDescription(new() { ["Test:Mongo"] = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500" });
        Assert.Contains(description, new[] { "not reachable", "timed out" });
    }

    [Fact]
    public async Task The_full_check_is_reused_for_ten_seconds()
    {
        var time = new ManualTime();
        var runs = 0;
        var services = new ServiceCollection().AddLogging().AddSingleton<TimeProvider>(time);
        services.AddHealthChecks().AddCheck("counted", () => { runs++; return HealthCheckResult.Healthy(); });
        services.AddSingleton<HealthReportCache>();
        using var sp = services.BuildServiceProvider();
        var cache = sp.GetRequiredService<HealthReportCache>();

        await cache.GetAsync();
        time.Advance(TimeSpan.FromSeconds(9));
        await Task.WhenAll(cache.GetAsync(), cache.GetAsync());
        Assert.Equal(1, runs);

        time.Advance(TimeSpan.FromSeconds(1));
        await cache.GetAsync();
        Assert.Equal(2, runs);
    }

    private sealed class ManualTime : TimeProvider
    {
        private DateTimeOffset _now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => _now;
        public void Advance(TimeSpan by) => _now += by;
    }
}
