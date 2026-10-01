using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using YuGiOh_Analytics_Consumer.Service;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Services;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Hubs;
using Azure.Storage.Blobs;
using YuGiOhDeckApi.BackgroundServices;

namespace YuGiOhDeckApi
{
    public partial class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDB"));
            builder.Services.AddSingleton<IMongoDbService, MongoDbService>();
            builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();
            builder.Services.AddSignalR();
            builder.Services.AddHttpClient();

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
                client.Timeout = TimeSpan.FromMinutes(2);
            });

            builder.Services.AddHttpClient<IMasterDuelBanListService, MasterDuelBanListService>(client =>
            {
                var baseUrl = builder.Configuration["GoWorker:ConnectionString"]
                        ?? builder.Configuration["GoWorker:BaseUrl"]
                        ?? "http://localhost:8080";
                client.BaseAddress = new Uri(baseUrl);
                client.Timeout = TimeSpan.FromMinutes(5); // the full card database scrape is slow
            });

            builder.Services.AddHttpClient<INewsScraperService, GoNewsScraperClient>(client =>
            {
                var baseUrl = builder.Configuration["GoWorker:ConnectionString"]
                        ?? builder.Configuration["GoWorker:BaseUrl"]
                        ?? "http://localhost:8080";
                client.BaseAddress = new Uri(baseUrl);
                client.Timeout = TimeSpan.FromMinutes(2);
            });

            builder.Services.AddHostedService<NewsBackgroundService>();

            builder.Services.AddHostedService<KafkaToSignalRBridge>();
            builder.Services.AddHostedService<MetaDeckBackgroundService>();
            builder.Services.AddHostedService<MasterDuelBackgroundService>();

            string blobConnectionString = builder.Configuration["BlobStorage:ConnectionString"]
                           ?? builder.Configuration["BlobStorage__ConnectionString"]
                           ?? throw new InvalidOperationException("CRITICAL ERROR: Azure Storage connection string is missing in configuration.");

            builder.Services.AddSingleton(sp => new BlobServiceClient(blobConnectionString));

            builder.Services.AddStackExchangeRedisCache(options =>
            {
                var redisConnection = builder.Configuration["Redis:ConnectionString"]
                                    ?? builder.Configuration["REDIS_CONNECTIONSTRING"];

                options.Configuration = redisConnection;
                options.InstanceName = "Erregeteygo_";
            });

            builder.Services.AddSingleton<IMongoCollection<CardStat>>(sp =>
            {
                var config = sp.GetRequiredService<IConfiguration>();

                var connectionString = config["CosmosDb:ConnectionString"]
                                    ?? config["CosmosDb__ConnectionString"]
                                    ?? config["CONNECTIONSTRING"]; // Some Azure environments use this

                if (string.IsNullOrEmpty(connectionString))
                {
                    throw new InvalidOperationException("CRITICAL ERROR: Connection string for Analytics is NULL. Check Azure Environment Variables.");
                }

                var client = new MongoClient(connectionString);

                var database = client.GetDatabase("YuGiOhAnalytics");

                return database.GetCollection<CardStat>("DeckStats");
            });

            // --- Authentication: validate JWTs issued by YuGiOhIdentityApi ---
            // Env vars in Azure: Jwt__Key, Jwt__Issuer, Jwt__Audience (same values as the Identity API).
            var jwtKey = builder.Configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
                throw new InvalidOperationException("Jwt:Key is missing. It must match the Identity API's signing key.");

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.MapInboundClaims = false; // keep claim names as issued ("sub", "userId")
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidateAudience = true,
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                        ClockSkew = TimeSpan.FromMinutes(1),
                        NameClaimType = "sub"
                    };

                });
            builder.Services.AddAuthorization();

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

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddApplicationInsightsTelemetry();

            var app = builder.Build();

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

            // Public liveness + database check, used by the deploy smoke test (replaces a user-specific URL).
            app.MapGet("/health", async (IMongoDbService db) =>
            {
                try
                {
                    await db.GetByUserIdAsync("__health__"); // cheap read that proves Mongo answers
                    return Results.Ok(new { status = "ok" });
                }
                catch
                {
                    return Results.StatusCode(503);
                }
            });
            app.MapControllers();

            app.Run();
        }
    }
}