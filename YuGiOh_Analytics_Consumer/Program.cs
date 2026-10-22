using YuGiOh.ServiceDefaults;
using YuGiOh_Analytics_Consumer.Service;

namespace YuGiOh_Analytics_Consumer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = Host.CreateApplicationBuilder(args);

            // Traces, metrics and logs (see Shared/YuGiOh.ServiceDefaults).
            builder.AddServiceTelemetry("analytics-consumer");

            builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();
            builder.Services.AddHostedService<Worker>();

            var host = builder.Build();
            host.Run();
        }
    }
}