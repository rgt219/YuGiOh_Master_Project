using YuGiOh_Analytics_Consumer.Service;

namespace YuGiOh_Analytics_Consumer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = Host.CreateApplicationBuilder(args);

            // 1. Add Controllers for API endpoints (e.g., /api/analytics/recent-activity)
            builder.Services.AddControllers();

            // 2. Configure CORS Policy for erregeteygo.com
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowErregeteYgo", policy =>
                {
                    policy.WithOrigins(
                            "https://erregeteygo.com",
                            "https://www.erregeteygo.com",
                            "http://localhost:3000"
                          )
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials(); // Required for SignalR & credentials
                });
            });

            // 3. Keep your registered services
            builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();
            builder.Services.AddHostedService<Worker>();

            var host = builder.Build();

            // 4. Configure HTTP request pipeline & CORS middleware
            var app = (IHost)host; // Using IHost pipeline execution

            // If using WebApplication/ASP.NET Core Web API host:
            // Ensure app.UseCors("AllowErregeteYgo") is called before mapping controllers/hubs.

            host.Run();
        }
    }
}