using Microsoft.ApplicationInsights.AspNetCore;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using YuGiOh_Analytics_Consumer.Service;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Hubs;
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
            builder.Services.AddSignalR();
            builder.Services.AddHostedService<KafkaToSignalRBridge>();

            // Register the Analytics Collection
            builder.Services.AddSingleton<IMongoCollection<CardStat>>(sp =>
            {
                var config = sp.GetRequiredService<IConfiguration>();

                // 1. Check ALL possible naming conventions Azure uses
                var connectionString = config["CosmosDb:ConnectionString"]
                                    ?? config["CosmosDb__ConnectionString"]
                                    ?? config["CONNECTIONSTRING"]; // Some Azure environments use this

                if (string.IsNullOrEmpty(connectionString))
                {
                    // This will force the REAL error into the Azure Log Stream
                    throw new InvalidOperationException("CRITICAL ERROR: Connection string for Analytics is NULL. Check Azure Environment Variables.");
                }

                var client = new MongoClient(connectionString);

                // 2. Database name MUST match your appsettings.json exactly
                var database = client.GetDatabase("YuGiOhAnalytics");

                return database.GetCollection<CardStat>("DeckStats");
            });


            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("DeckListDb"));

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("MyCors", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
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

            // DIAGNOSTIC: This will show up in your Azure Log Stream
            var kafkaCheck = app.Configuration["Kafka:ConnectionString"];
            Console.WriteLine($"DEBUG: Kafka Connection String is {(string.IsNullOrEmpty(kafkaCheck) ? "MISSING" : "FOUND")}");

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

            app.MapHub<ActivityHub>("/activityHub");

            app.MapGet("/", () => "Hello World!");
            app.MapControllers();

            app.Run();
        }
    }
}