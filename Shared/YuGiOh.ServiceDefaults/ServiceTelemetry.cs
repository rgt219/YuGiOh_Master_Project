using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace YuGiOh.ServiceDefaults
{
    // One place that decides what every service reports: traces, metrics and logs, all tagged with the service name.
    //
    // Nothing is sent anywhere unless OTEL_EXPORTER_OTLP_ENDPOINT is set (docker-compose sets it to the local
    // Grafana stack). Without it the instrumentation still runs, so trace IDs keep flowing between services
    // through HTTP and Kafka headers, but nothing leaves the process.
    //
    // Web APIs add the ASP.NET Core request instrumentation on top, see their Program.cs.
    public static class ServiceTelemetry
    {
        // Spans from the MongoDB driver itself (built in since driver 3.7). Query text is not recorded.
        public const string MongoActivitySource = "MongoDB.Driver";

        public static OpenTelemetryBuilder AddServiceTelemetry(this IHostApplicationBuilder builder, string serviceName)
        {
            // Logs written inside a request or a Kafka message carry its trace ID, so a log line leads to its trace.
            builder.Logging.AddOpenTelemetry(logging =>
            {
                logging.IncludeFormattedMessage = true;
                logging.IncludeScopes = true;
            });

            var otel = builder.Services.AddOpenTelemetry()
                .ConfigureResource(resource => resource
                    .AddService(serviceName, serviceInstanceId: Environment.MachineName)
                    .AddAttributes(new Dictionary<string, object>
                    {
                        ["deployment.environment.name"] = builder.Environment.EnvironmentName.ToLowerInvariant()
                    }))
                .WithTracing(tracing => tracing
                    .AddSource(KafkaTracing.ActivitySourceName)
                    .AddSource(MongoActivitySource)
                    .AddHttpClientInstrumentation())
                .WithMetrics(metrics => metrics
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation());

            if (!string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
                otel.UseOtlpExporter();   // endpoint, protocol and headers come from the standard OTEL_* env vars

            return otel;
        }
    }
}
