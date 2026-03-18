using Microsoft.EntityFrameworkCore;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;
using YuGiOh_Analytics_Consumer.Service;
using Microsoft.ApplicationInsights.AspNetCore;
//Comment for pushing

namespace YuGiOhDeckApi
{
    public partial class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // 1. SERVICES CONFIGURATION
            builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDB"));
            builder.Services.AddSingleton<MongoDbService>();
            builder.Services.AddSingleton<IMongoDbService, MongoDbService>();
            builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();

            builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDBSettings"));

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("DeckListDb"));

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("MyCors", policy =>
                {
                    policy.WithOrigins("https://frontend.happybush-e43d89b2.eastus.azurecontainerapps.io")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            builder.Services.AddScoped<IDeckListRepository, DeckListRepository>();
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddApplicationInsightsTelemetry();

            // 2. BUILD THE APP
            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                try
                {
                    var kafkaService = scope.ServiceProvider.GetRequiredService<IKafkaProducerService>();
                    logger.LogInformation("YuGiOh API Heartbeat: KafkaProducerService successfully initialized.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "YuGiOh API Startup Error: Failed to initialize KafkaProducerService. Check Environment Variables.");
                }
            }

            // 3. MIDDLEWARE PIPELINE
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
                    c.RoutePrefix = string.Empty;
                });
            }

            app.UseRouting();
            app.UseCors("MyCors");
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapGet("/", () => "Hello World!");
            app.MapControllers();

            app.Run();
        }
    }
}