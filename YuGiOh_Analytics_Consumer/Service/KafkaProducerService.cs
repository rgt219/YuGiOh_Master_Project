using Confluent.Kafka;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
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

            // 🚀 Serialize the full payload directly to JSON string
            var jsonValue = JsonSerializer.Serialize(deck);

            await producer.ProduceAsync("deck-updates", new Message<string, string>
            {
                Key = Guid.NewGuid().ToString(),
                Value = jsonValue
            });
        }
    }
}
