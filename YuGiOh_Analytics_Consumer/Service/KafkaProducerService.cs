using Confluent.Kafka;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using YuGiOh.ServiceDefaults;

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
            _producerConfig = KafkaConnection.Apply(new ProducerConfig
            {
                // Adding a timeout prevents the API from hanging if Event Hubs is unreachable
                MessageTimeoutMs = 5000,
                RequestTimeoutMs = 5000
            }, _config);
        }

        public async Task PublishDeckUpdate(object deck)
        {
            using var producer = new ProducerBuilder<string, string>(_producerConfig).Build();

            // 🚀 Serialize the full payload directly to JSON string
            var jsonValue = JsonSerializer.Serialize(deck);

            var message = new Message<string, string>
            {
                Key = Guid.NewGuid().ToString(),
                Value = jsonValue
            };

            // The trace ID rides along in the message headers, so the consumers join this request's trace.
            using var activity = KafkaTracing.StartPublish("deck-updates", message);
            try
            {
                var delivery = await producer.ProduceAsync("deck-updates", message);
                KafkaTracing.RecordDelivery(activity, delivery);
            }
            catch (Exception ex)
            {
                KafkaTracing.RecordError(activity, ex);
                throw;
            }
        }
    }
}