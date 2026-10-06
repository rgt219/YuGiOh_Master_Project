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
                MessageTimeoutMs = 15000         // give up (and throw) after 15 seconds instead of hanging forever
            }).Build();
        }

        public async Task PublishAsync(PriceDropEvent priceDrop, CancellationToken cancellationToken = default)
        {
            if (_producer == null)
            {
                _logger.LogInformation("[NOT PUBLISHED] {Card} {Old} -> {New}", priceDrop.CardName, priceDrop.OldPrice, priceDrop.NewPrice);
                return;
            }

            await _producer.ProduceAsync(
                PriceDropEvent.Topic,
                new Message<string, string>
                {
                    // Same key = same partition = one card's events stay in order.
                    Key = priceDrop.ProductId.ToString(),
                    Value = JsonSerializer.Serialize(priceDrop, Json)
                },
                cancellationToken);
        }

        public void Dispose()
        {
            _producer?.Flush(TimeSpan.FromSeconds(5)); // deliver anything still waiting before shutting down
            _producer?.Dispose();
        }
    }
}