using System.Text.Json;
using Confluent.Kafka;

namespace YuGiOhDeckApi.Notifications
{
    // Listens to the "price-drops" event hub and hands each message to PriceDropNotifier.
    // It is deliberately thin: reading, parsing, retrying and committing live here, the actual decisions live in the notifier.
    public class PriceDropConsumer : BackgroundService
    {
        public const string Topic = "price-drops";
        public const string GroupId = "notifications-consumer";   // this service's own "bookmark" on the topic
        private const int MaxAttempts = 5;

        private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

        // The same problem is reported once, then at most once every 5 minutes.
        private readonly LogThrottle _problems = new(TimeSpan.FromMinutes(5));

        private readonly IConfiguration _config;
        private readonly PriceDropNotifier _notifier;
        private readonly ILogger<PriceDropConsumer> _logger;

        public PriceDropConsumer(IConfiguration config, PriceDropNotifier notifier, ILogger<PriceDropConsumer> logger)
        {
            _config = config;
            _notifier = notifier;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Yield();   // let the app finish starting before this blocking loop begins

            var connectionString = _config["Kafka:ConnectionString"];
            var bootstrapServers = _config["Kafka:BootstrapServers"];
            if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(bootstrapServers))
            {
                _logger.LogWarning("Kafka settings are missing. The price drop consumer is not running.");
                return;
            }

            var config = new ConsumerConfig
            {
                BootstrapServers = bootstrapServers,
                GroupId = GroupId,
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = connectionString,

                // We tell Event Hubs "done with this message" ourselves, AFTER it has been handled.
                // If the app dies mid-message, the message is delivered again instead of being lost.
                EnableAutoCommit = false,

                // A brand-new group starts from the oldest message still kept, so nothing published before the
                // first deploy is missed. After that, the committed bookmark decides where to continue.
                AutoOffsetReset = AutoOffsetReset.Earliest,

                // Event Hubs closes idle connections after a few minutes and the client reconnects by itself.
                // That is normal, so do not write a log line every time it happens.
                LogConnectionClose = false,
                SocketKeepaliveEnable = true
            };

            // The server name is safe to log. The connection string (a password) never is.
            _logger.LogInformation("Price drop consumer connecting to {Server}, topic '{Topic}', group '{Group}'...",
                bootstrapServers, Topic, GroupId);

            using var consumer = new ConsumerBuilder<string, string>(config)
                // Connection-level trouble (broker unreachable, bad credentials...). Goes through the throttle.
                .SetErrorHandler((_, error) => ReportProblem(error.IsFatal ? $"FATAL: {error.Reason}" : error.Reason))
                // The client's own chatter. Only warnings and worse are kept (a LOWER level number means MORE severe).
                .SetLogHandler((_, log) =>
                {
                    if (log.Level > SyslogLevel.Warning) return;
                    ReportProblem(log.Message);
                })
                // This is the proof that we are really connected: the hub accepted us and gave us partitions to read.
                .SetPartitionsAssignedHandler((_, partitions) =>
                {
                    var hidden = _problems.Clear();
                    if (hidden >= 0)
                        _logger.LogInformation("Price drop consumer recovered ({Hidden} repeated error reports were hidden).", hidden);

                    _logger.LogInformation("Price drop consumer connected. Joined group '{Group}' on '{Topic}', partitions assigned: {Partitions}",
                        GroupId, Topic, partitions.Count == 0 ? "none" : string.Join(", ", partitions.Select(p => p.Partition.Value)));
                })
                .SetPartitionsRevokedHandler((_, partitions) =>
                {
                    _logger.LogInformation("Price drop consumer released partitions: {Partitions}",
                        string.Join(", ", partitions.Select(p => p.Partition.Value)));
                })
                .Build();

            consumer.Subscribe(Topic);

            var failures = 0;
            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    ConsumeResult<string, string>? result;
                    try
                    {
                        result = consumer.Consume(stoppingToken);   // waits here until a message arrives
                        failures = 0;
                    }
                    catch (ConsumeException ex)
                    {
                        failures++;
                        ReportProblem($"Could not read from '{Topic}': {ex.Error.Reason}");

                        // Wait longer after each failure: 5s, 10s, 20s, 40s, then 60s at most.
                        var delay = TimeSpan.FromSeconds(Math.Min(60, 5 * Math.Pow(2, Math.Min(failures - 1, 4))));
                        await Task.Delay(delay, stoppingToken);
                        continue;
                    }

                    if (result?.Message?.Value == null) continue;

                    await ProcessAsync(result.Message.Value, stoppingToken);
                    consumer.Commit(result);   // only now: handled (or deliberately skipped), so move the bookmark forward
                }
            }
            catch (OperationCanceledException)
            {
                // The app is shutting down. Normal.
            }
            finally
            {
                consumer.Close();   // leave the group cleanly so another instance can take over straight away
                _logger.LogInformation("Price drop consumer stopped.");
            }
        }

        // One place for "something is wrong with the connection": reported once, repeats counted instead of printed.
        private void ReportProblem(string reason)
        {
            if (!_problems.ShouldLog(reason, out var hidden)) return;

            if (hidden > 0)
                _logger.LogError("Price drop consumer problem: {Reason} (the same problem was reported {Hidden} more times since the last report)", reason, hidden);
            else
                _logger.LogError("Price drop consumer problem: {Reason}", reason);
        }

        private async Task ProcessAsync(string json, CancellationToken stoppingToken)
        {
            PriceDropMessage? message;
            try
            {
                message = JsonSerializer.Deserialize<PriceDropMessage>(json, Json);
            }
            catch (JsonException ex)
            {
                // A message that can never be read will never become readable by retrying. Skip it, loudly.
                _logger.LogError("Skipping unreadable price drop message: {Message}", ex.Message);
                return;
            }

            if (message == null)
            {
                _logger.LogError("Skipping empty price drop message.");
                return;
            }

            // Debug level: useful when investigating, invisible in normal running. (Turn it on with Logging__LogLevel__YuGiOhDeckApi.Notifications=Debug.)
            _logger.LogDebug("Received price drop {EventId} for product {ProductId}", message.EventId, message.ProductId);

            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                try
                {
                    await _notifier.HandleAsync(message, stoppingToken);
                    return;
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    if (attempt == MaxAttempts)
                    {
                        // TODO (Step 7): park this message in a dead-letter store instead of dropping it.
                        _logger.LogError(ex, "Giving up on price drop {EventId} after {Attempts} attempts", message.EventId, MaxAttempts);
                        return;
                    }

                    var wait = TimeSpan.FromSeconds(Math.Pow(2, attempt));   // 2s, 4s, 8s, 16s
                    _logger.LogWarning("Price drop {EventId} failed (attempt {Attempt}/{Max}): {Message}. Retrying in {Wait}s",
                        message.EventId, attempt, MaxAttempts, ex.Message, wait.TotalSeconds);
                    await Task.Delay(wait, stoppingToken);
                }
            }
        }
    }
}