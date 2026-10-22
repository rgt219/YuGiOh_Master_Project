using System.Diagnostics;
using System.Text;
using Confluent.Kafka;
using OpenTelemetry;
using OpenTelemetry.Context.Propagation;

namespace YuGiOh.ServiceDefaults
{
    // Carries a trace across Kafka. Confluent.Kafka has no tracing of its own, so:
    //   - the producer starts a "send" span and writes its trace context into the message headers (W3C traceparent);
    //   - the consumer reads those headers and starts a "process" span as a child of the producer's span.
    // The result is one trace from the HTTP request that published an event to every service that handled it.
    // Span names and tags follow the OpenTelemetry messaging conventions.
    public static class KafkaTracing
    {
        public const string ActivitySourceName = "YuGiOh.Messaging";

        private static readonly ActivitySource Source = new(ActivitySourceName);

        public static Activity? StartPublish<TKey, TValue>(string topic, Message<TKey, TValue> message)
        {
            var activity = Source.StartActivity($"send {topic}", ActivityKind.Producer);
            Tag(activity, topic, "send");

            // Even with no span of our own (nobody listening), pass on the caller's context so the chain is not broken.
            var context = activity?.Context ?? Activity.Current?.Context ?? default;
            message.Headers ??= new Headers();
            Propagators.DefaultTextMapPropagator.Inject(new PropagationContext(context, Baggage.Current), message.Headers, SetHeader);

            return activity;
        }

        public static void RecordDelivery<TKey, TValue>(Activity? activity, DeliveryResult<TKey, TValue> delivery)
        {
            activity?.SetTag("messaging.destination.partition.id", delivery.Partition.Value.ToString());
            activity?.SetTag("messaging.kafka.offset", delivery.Offset.Value);
        }

        public static Activity? StartProcess<TKey, TValue>(ConsumeResult<TKey, TValue> result, string consumerGroup)
        {
            var parent = Propagators.DefaultTextMapPropagator.Extract(default, result.Message.Headers, GetHeader);
            Baggage.Current = parent.Baggage;

            var activity = Source.StartActivity($"process {result.Topic}", ActivityKind.Consumer, parent.ActivityContext);
            Tag(activity, result.Topic, "process");
            activity?.SetTag("messaging.consumer.group.name", consumerGroup);
            activity?.SetTag("messaging.destination.partition.id", result.Partition.Value.ToString());
            activity?.SetTag("messaging.kafka.offset", result.Offset.Value);
            return activity;
        }

        public static void RecordError(Activity? activity, Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.AddException(ex);
        }

        private static void Tag(Activity? activity, string topic, string operation)
        {
            activity?.SetTag("messaging.system", "kafka");
            activity?.SetTag("messaging.destination.name", topic);
            activity?.SetTag("messaging.operation.type", operation);
        }

        private static void SetHeader(Headers headers, string key, string value)
        {
            headers.Remove(key);
            headers.Add(key, Encoding.UTF8.GetBytes(value));
        }

        private static IEnumerable<string> GetHeader(Headers? headers, string key)
        {
            if (headers != null && headers.TryGetLastBytes(key, out var bytes))
                return new[] { Encoding.UTF8.GetString(bytes) };
            return Enumerable.Empty<string>();
        }
    }
}
