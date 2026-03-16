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
            _producerConfig = new ProducerConfig
            {
                BootstrapServers = _config["Kafka:BootstrapServers"],
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = _config["Kafka:ConnectionString"]
            };
        }

        public async Task PublishDeckUpdate(string deckName, string action)
        {
            using var producer = new ProducerBuilder<string, string>(_producerConfig).Build();
            var message = new Message<string, string>
            {
                Key = deckName,
                Value = $"{action}: {deckName} at {DateTime.UtcNow}"
            };

            await producer.ProduceAsync(_config["Kafka:Topic"], message);
        }
    }
}
