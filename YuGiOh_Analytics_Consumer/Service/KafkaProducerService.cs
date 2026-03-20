using Confluent.Kafka;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace YuGiOh_Analytics_Consumer.Service
{
    public interface IKafkaProducerService
    {
        // Use the full explicit namespace to stop the redlines
        Task PublishDeckUpdate(object deck);
    }

    public class KafkaProducerService : IKafkaProducerService
    {
        private readonly IConfiguration _config;
        private readonly ProducerConfig _producerConfig;

        public KafkaProducerService(IConfiguration config)
        {
            _config = config;

            // Use the exact keys you set in the Azure Portal
            _producerConfig = new ProducerConfig
            {
                BootstrapServers = _config["Kafka:BootstrapServers"],
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = _config["Kafka:ConnectionString"],

                // Adding a timeout prevents the API from hanging if Event Hubs is unreachable
                MessageTimeoutMs = 5000,
                RequestTimeoutMs = 5000
            };
        }

        public async Task PublishDeckUpdate(object deck)
        {
            using var producer = new ProducerBuilder<string, string>(_producerConfig).Build();

            // Cast to dynamic so we can read Title, MainDeck, etc., 
            // even if this project doesn't 'know' what a DeckList is.
            dynamic d = deck;

            var payload = new
            {
                username = d.UserId ?? "erregete",
                title = d.Title,
                mainDeck = d.MainDeck ?? new List<string>(),
                extraDeck = d.ExtraDeck ?? new List<string>(),
                sideDeck = d.SideDeck ?? new List<string>(),
                timestamp = DateTime.UtcNow
            };

            var jsonValue = System.Text.Json.JsonSerializer.Serialize(payload);

            await producer.ProduceAsync("deck-updates", new Message<string, string>
            {
                Key = d.Id?.ToString() ?? Guid.NewGuid().ToString(),
                Value = jsonValue
            });
        }
    }
}
