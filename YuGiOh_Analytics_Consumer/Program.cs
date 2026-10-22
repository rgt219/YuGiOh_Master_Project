using Microsoft.AspNetCore.Builder;
using YuGiOh.ServiceDefaults;
using YuGiOh_Analytics_Consumer.Service;

namespace YuGiOh_Analytics_Consumer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // A web host only so the worker can answer health checks (Azure's probes and the site's /status page).
            // The real work is still the Kafka consumer in Worker.
            var builder = WebApplication.CreateBuilder(args);

            // Traces, metrics and logs (see Shared/YuGiOh.ServiceDefaults).
            builder.AddServiceTelemetry("analytics-consumer");

            builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();
            builder.Services.AddHostedService<Worker>();

            builder.AddServiceHealthChecks()
                .AddMongoCheck("CosmosDb:ConnectionString")
                .AddKafkaCheck();

            var app = builder.Build();
            app.MapServiceHealthChecks();
            app.Run();
        }
    }
}