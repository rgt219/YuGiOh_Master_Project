using Microsoft.ApplicationInsights.AspNetCore;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using YuGiOh_Analytics_Consumer.Service;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Services;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Hubs;
using Azure.Storage.Blobs;
using YuGiOhDeckApi.BackgroundServices;
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
            builder.Services.AddHttpClient();
            // Register Meta Deck Scraper Service
            // Register HttpClient and Scraper Service
            // Register HTTP Client Adapters pointing to the Go microservice
            builder.Services.AddHttpClient<GoMetaDeckScraperClient>(client =>
            {
                var baseUrl = builder.Configuration["GoWorker:ConnectionString"] ?? "http://localhost:8080";
                client.BaseAddress = new Uri(baseUrl);
            });

            builder.Services.AddHttpClient<ICardImageSyncService, GoCardImageSyncClient>(client =>
            {
                var baseUrl = builder.Configuration["GoWorker:ConnectionString"] ?? "http://localhost:8080";
                client.BaseAddress = new Uri(baseUrl);
            });

            builder.Services.AddHttpClient<IMetaDeckScraperService, GoMetaDeckScraperClient>(client =>
            {
                var baseUrl = builder.Configuration["GoWorker:ConnectionString"]
                        ?? builder.Configuration["GoWorker:BaseUrl"]
                        ?? "http://localhost:8080";
                client.BaseAddress = new Uri(baseUrl);
            });

            builder.Services.AddHostedService<KafkaToSignalRBridge>();
            // Register the background service
            builder.Services.AddHostedService<MetaDeckBackgroundService>();

            string blobConnectionString = builder.Configuration["BlobStorage:ConnectionString"]
                           ?? builder.Configuration["BlobStorage__ConnectionString"]
                           ?? throw new InvalidOperationException("CRITICAL ERROR: Azure Storage connection string is missing in configuration.");

            builder.Services.AddSingleton(sp => new BlobServiceClient(blobConnectionString));

            builder.Services.AddStackExchangeRedisCache(options =>
            {
                var redisConnection = builder.Configuration["Redis:ConnectionString"]
                                    ?? builder.Configuration["REDIS_CONNECTIONSTRING"];

                options.Configuration = redisConnection;
                options.InstanceName = "Erregeteygo_"; // Prefixes all keys in Redis
            });

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
                    policy.WithOrigins(
                                "http://localhost:3000",
                                "https://frontend.happybush-e43d89b2.eastus.azurecontainerapps.io",
                                "https://erregeteygo.com", "https://www.erregeteygo.com",
                                "https://localhost:3000"
                            )
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

            app.MapGet("/", () => "DECK API");
            app.MapControllers();

            app.Run();
        }
    }
}