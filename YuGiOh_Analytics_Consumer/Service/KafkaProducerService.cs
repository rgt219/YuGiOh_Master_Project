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
        Task PublishDeckUpdate(string deckName, string action);
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

        public async Task PublishDeckUpdate(string deckName, string action)
        {
            // It's often better to build the producer once, but for low-traffic 
            // this 'using' block works fine.
            using var producer = new ProducerBuilder<string, string>(_producerConfig).Build();

            var message = new Message<string, string>
            {
                Key = deckName,
                Value = $"{action}: {deckName} at {DateTime.UtcNow}"
            };

            try
            {
                // Ensure this matches "deck-updates" set in your Azure Env Variables
                var topic = _config["Kafka:Topic"] ?? "deck-updates";
                await producer.ProduceAsync(topic, message);
            }
            catch (ProduceException<string, string> e)
            {
                // If this fails, check your API logs for SASL authentication errors
                Console.WriteLine($"Kafka Error: {e.Error.Reason}");
                throw;
            }
        }
    }
}
