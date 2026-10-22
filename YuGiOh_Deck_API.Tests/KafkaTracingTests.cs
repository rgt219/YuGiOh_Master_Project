using System.Diagnostics;
using System.Text;
using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using OpenTelemetry;
using OpenTelemetry.Trace;
using Xunit;
using YuGiOh.ServiceDefaults;

public class KafkaTracingTests : IDisposable
{
    // Building a tracer provider is what turns on W3C propagation and makes our spans get recorded.
    private readonly TracerProvider _tracing = Sdk.CreateTracerProviderBuilder()
        .AddSource(KafkaTracing.ActivitySourceName)
        .Build()!;

    public void Dispose() => _tracing.Dispose();

    private static ConsumeResult<string, string> Received(Message<string, string> message) => new()
    {
        Topic = "deck-updates",
        Partition = new Partition(2),
        Offset = new Offset(42),
        Message = message
    };

    [Fact]
    public void Consumer_continues_the_producers_trace()
    {
        var message = new Message<string, string> { Key = "k", Value = "{}" };

        string traceId, producerSpanId;
        using (var send = KafkaTracing.StartPublish("deck-updates", message))
        {
            Assert.NotNull(send);
            traceId = send!.TraceId.ToString();
            producerSpanId = send.SpanId.ToString();
        }

        Assert.True(message.Headers.TryGetLastBytes("traceparent", out var header));
        Assert.Contains(traceId, Encoding.UTF8.GetString(header));

        using var process = KafkaTracing.StartProcess(Received(message), "analytics-consumer-group");

        Assert.NotNull(process);
        Assert.Equal(ActivityKind.Consumer, process!.Kind);
        Assert.Equal(traceId, process.TraceId.ToString());
        Assert.Equal(producerSpanId, process.ParentSpanId.ToString());
        Assert.Equal("process deck-updates", process.DisplayName);
        Assert.Equal("kafka", process.GetTagItem("messaging.system"));
        Assert.Equal("2", process.GetTagItem("messaging.destination.partition.id"));
        Assert.Equal(42L, process.GetTagItem("messaging.kafka.offset"));
    }

    [Fact]
    public void Publish_inside_a_request_joins_the_requests_trace()
    {
        // Stands in for the sampled request span ASP.NET Core instrumentation would have started.
        using var request = new Activity("POST /api/decks");
        request.ActivityTraceFlags = ActivityTraceFlags.Recorded;
        request.Start();
        var message = new Message<string, string> { Key = "k", Value = "{}" };

        using var send = KafkaTracing.StartPublish("deck-updates", message);

        Assert.Equal(request.TraceId, send!.TraceId);
        Assert.Equal(request.SpanId, send.ParentSpanId);
    }

    [Fact]
    public void Message_without_trace_headers_starts_a_new_trace()
    {
        var message = new Message<string, string> { Key = "k", Value = "{}" };   // e.g. published by an older version

        using var process = KafkaTracing.StartProcess(Received(message), "g");

        Assert.NotNull(process);
        Assert.Equal(default, process!.ParentSpanId);
    }

    [Fact]
    public void Publishing_twice_does_not_stack_traceparent_headers()
    {
        var message = new Message<string, string> { Key = "k", Value = "{}" };

        using (KafkaTracing.StartPublish("deck-updates", message)) { }
        using (KafkaTracing.StartPublish("deck-updates", message)) { }   // a retry reuses the same message

        Assert.Single(message.Headers, h => h.Key == "traceparent");
    }

    [Theory]
    [InlineData("Plaintext", null, true)]                        // local docker-compose broker
    [InlineData(null, "Endpoint=sb://x/;SharedAccessKey=y", true)] // Event Hubs
    [InlineData(null, null, false)]                              // nothing set: Kafka is skipped
    public void Kafka_is_configured_only_with_a_way_to_authenticate(string? protocol, string? connectionString, bool expected)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Kafka:BootstrapServers"] = "broker:9092",
            ["Kafka:SecurityProtocol"] = protocol,
            ["Kafka:ConnectionString"] = connectionString
        }).Build();

        Assert.Equal(expected, KafkaConnection.IsConfigured(config));
    }

    [Fact]
    public void Event_hubs_settings_use_sasl_ssl_with_the_connection_string()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Kafka:BootstrapServers"] = "ns.servicebus.windows.net:9093",
            ["Kafka:ConnectionString"] = "Endpoint=sb://ns/;SharedAccessKey=secret"
        }).Build();

        var client = KafkaConnection.Apply(new ProducerConfig(), config);

        Assert.Equal(SecurityProtocol.SaslSsl, client.SecurityProtocol);
        Assert.Equal("$ConnectionString", client.SaslUsername);
        Assert.Equal("Endpoint=sb://ns/;SharedAccessKey=secret", client.SaslPassword);
    }
}
