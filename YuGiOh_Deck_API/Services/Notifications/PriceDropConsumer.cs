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
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe(Topic);
            _logger.LogInformation("Price drop consumer listening on '{Topic}' as group '{Group}'", Topic, GroupId);

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    ConsumeResult<string, string>? result;
                    try
                    {
                        result = consumer.Consume(stoppingToken);   // waits here until a message arrives
                    }
                    catch (ConsumeException ex)
                    {
                        _logger.LogError("Could not read from '{Topic}': {Reason}", Topic, ex.Error.Reason);
                        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
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
            }
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