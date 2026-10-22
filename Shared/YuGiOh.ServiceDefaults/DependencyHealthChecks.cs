using System.Collections.Concurrent;
using Confluent.Kafka;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Bson;
using MongoDB.Driver;

namespace YuGiOh.ServiceDefaults
{
    // The individual checks behind /health. Each one answers "can I reach it right now?" and never throws:
    // a failure comes back as the registration's failure status (Unhealthy for critical, Degraded otherwise).
    // The 5 second limit per check is set on the registration (ServiceHealth.Registration).

    internal static class DependencyCheck
    {
        public static HealthCheckResult Failed(HealthCheckContext context, Exception ex) => new(
            context.Registration.FailureStatus,
            ex is OperationCanceledException ? HealthDescriptions.TimedOut : HealthDescriptions.NotReachable,
            ex);
    }

    internal sealed class MongoHealthCheck : IHealthCheck
    {
        // One client per connection string for the life of the process. Clients are expensive and meant to be shared.
        private static readonly ConcurrentDictionary<string, MongoClient> Clients = new();

        private readonly IConfiguration _config;
        private readonly string[] _keys;

        public MongoHealthCheck(IConfiguration config, string[] keys)
        {
            _config = config;
            _keys = keys;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            var connectionString = _keys.Select(k => _config[k]).FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
            if (connectionString == null)
                return new HealthCheckResult(context.Registration.FailureStatus, HealthDescriptions.NotConfigured);

            try
            {
                var client = Clients.GetOrAdd(connectionString, cs =>
                {
                    var settings = MongoClientSettings.FromConnectionString(cs);
                    settings.ServerSelectionTimeout = TimeSpan.FromSeconds(4);
                    return new MongoClient(settings);
                });

                await client.GetDatabase("admin").RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: cancellationToken);
                return HealthCheckResult.Healthy(HealthDescriptions.Reachable);
            }
            catch (Exception ex)
            {
                return DependencyCheck.Failed(context, ex);
            }
        }
    }

    internal sealed class KafkaHealthCheck : IHealthCheck
    {
        private static readonly ConcurrentDictionary<string, IAdminClient> Admins = new();

        private readonly IConfiguration _config;

        public KafkaHealthCheck(IConfiguration config) => _config = config;

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            if (!KafkaConnection.IsConfigured(_config))
                return new HealthCheckResult(context.Registration.FailureStatus, HealthDescriptions.NotConfigured);

            try
            {
                var admin = Admins.GetOrAdd(_config["Kafka:BootstrapServers"]!, _ =>
                    new AdminClientBuilder(KafkaConnection.Apply(new AdminClientConfig
                        {
                            // Event Hubs closes idle connections every few minutes and the client reconnects by itself.
                            // Without these, that normal churn would print an error line each time.
                            LogConnectionClose = false,
                            SocketKeepaliveEnable = true
                        }, _config))
                        .SetErrorHandler((_, _) => { })   // problems show up as this check's result instead
                        .SetLogHandler((_, _) => { })
                        .Build());

                // GetMetadata blocks, so keep it off the request thread.
                var metadata = await Task.Run(() => admin.GetMetadata(TimeSpan.FromSeconds(4)), cancellationToken);
                return metadata.Brokers.Count > 0
                    ? HealthCheckResult.Healthy(HealthDescriptions.Reachable)
                    : new HealthCheckResult(context.Registration.FailureStatus, HealthDescriptions.NotReachable);
            }
            catch (Exception ex)
            {
                return DependencyCheck.Failed(context, ex);
            }
        }
    }

    internal sealed class DistributedCacheHealthCheck : IHealthCheck
    {
        private readonly IDistributedCache _cache;

        public DistributedCacheHealthCheck(IDistributedCache cache) => _cache = cache;

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                await _cache.GetAsync("health-check", cancellationToken);   // a missing key is fine: the point is the round trip
                return HealthCheckResult.Healthy(HealthDescriptions.Reachable);
            }
            catch (Exception ex)
            {
                return DependencyCheck.Failed(context, ex);
            }
        }
    }

    internal sealed class HttpHealthCheck : IHealthCheck
    {
        private readonly IHttpClientFactory _clients;
        private readonly string? _baseUrl;

        public HttpHealthCheck(IHttpClientFactory clients, string? baseUrl)
        {
            _clients = clients;
            _baseUrl = baseUrl;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_baseUrl) || !Uri.TryCreate(_baseUrl, UriKind.Absolute, out var baseUri))
                return new HealthCheckResult(context.Registration.FailureStatus, HealthDescriptions.NotConfigured);

            try
            {
                using var response = await _clients.CreateClient().GetAsync(new Uri(baseUri, "/health/live"), cancellationToken);
                return response.IsSuccessStatusCode
                    ? HealthCheckResult.Healthy(HealthDescriptions.Reachable)
                    : new HealthCheckResult(context.Registration.FailureStatus, HealthDescriptions.NotReachable);
            }
            catch (Exception ex)
            {
                return DependencyCheck.Failed(context, ex);
            }
        }
    }
}
