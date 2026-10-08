using System.Text.Json;
using Confluent.Kafka;

namespace MarketTelemetry.Service.Events
{
    // What the worker is allowed to know about publishing: "send this event". Nothing about Kafka or Azure.
    public interface IPriceDropPublisher
    {
        Task PublishAsync(PriceDropEvent priceDrop, CancellationToken cancellationToken = default);
    }

    // Sends price drops to the "price-drops" event hub through its Kafka-compatible endpoint
    // (same setup as the Deck API's deck-updates producer).
    public sealed class KafkaPriceDropPublisher : IPriceDropPublisher, IDisposable
    {
        private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web); // camelCase property names

        private readonly ILogger<KafkaPriceDropPublisher> _logger;
        private readonly IProducer<string, string>? _producer;
        private string? _lastProblem;   // so the same connection problem is reported once, not on every retry

        public KafkaPriceDropPublisher(IConfiguration config, ILogger<KafkaPriceDropPublisher> logger)
        {
            _logger = logger;

            var connectionString = config["Kafka:ConnectionString"];
            var bootstrapServers = config["Kafka:BootstrapServers"];
            if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(bootstrapServers))
            {
                // Local development without Event Hubs: the service still starts, and drops are just logged.
                _logger.LogWarning("Kafka settings are missing. Price drops will be logged but NOT published.");
                return;
            }

            // One producer for the whole life of the app. Opening a connection is slow, so it is done once, not per message.
            _producer = new ProducerBuilder<string, string>(new ProducerConfig
            {
                BootstrapServers = bootstrapServers,
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = connectionString,
                Acks = Acks.All,                 // wait until Event Hubs has the message before calling it sent
                MessageTimeoutMs = 15000,        // give up (and throw) after 15 seconds instead of hanging forever
                LogConnectionClose = false,      // Event Hubs closes idle connections; the client reconnects by itself, no need to log it
                SocketKeepaliveEnable = true
            })
            .SetErrorHandler((_, error) =>
            {
                // Same reason as last time? Stay quiet. A new reason is worth a line.
                if (error.Reason == _lastProblem) return;
                _lastProblem = error.Reason;
                _logger.LogError("Price drop publisher connection problem: {Reason}", error.Reason);
            })
            .Build();

            // The server name is safe to log. The connection string (a password) never is.
            _logger.LogInformation("Price drop publisher ready: {Server}, topic '{Topic}'. (The actual connection opens on the first publish.)",
                bootstrapServers, PriceDropEvent.Topic);
        }

        public async Task PublishAsync(PriceDropEvent priceDrop, CancellationToken cancellationToken = default)
        {
            if (_producer == null)
            {
                _logger.LogInformation("[NOT PUBLISHED] {Card} {Old} -> {New}", priceDrop.CardName, priceDrop.OldPrice, priceDrop.NewPrice);
                return;
            }

            var delivery = await _producer.ProduceAsync(
                PriceDropEvent.Topic,
                new Message<string, string>
                {
                    // Same key = same partition = one card's events stay in order.
                    Key = priceDrop.ProductId.ToString(),
                    Value = JsonSerializer.Serialize(priceDrop, Json)
                },
                cancellationToken);

            _lastProblem = null;   // a publish worked, so any earlier connection problem is over

            // Debug level: shows where each message landed when investigating, silent in normal running.
            _logger.LogDebug("Published price drop for product {ProductId} to {Topic} [partition {Partition}, offset {Offset}]",
                priceDrop.ProductId, PriceDropEvent.Topic, delivery.Partition.Value, delivery.Offset.Value);
        }

        public void Dispose()
        {
            _producer?.Flush(TimeSpan.FromSeconds(5)); // deliver anything still waiting before shutting down
            _producer?.Dispose();
        }
    }
}