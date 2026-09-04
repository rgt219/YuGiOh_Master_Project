using MarketTelemetry.Service.Data;
using MarketTelemetry.Service.Models;
using MarketTelemetry.Service.Workers;

var builder = WebApplication.CreateBuilder(args);

// Use in-memory distributed cache locally to prevent 5-10s Redis connection timeouts
// 🚀 Uses lightning-fast local RAM for development, bypassing the Redis timeout
builder.Services.AddDistributedMemoryCache();
// if (builder.Environment.IsDevelopment())
// {
//     builder.Services.AddDistributedMemoryCache();
// }
// else
// {
//     // ☁️ When you eventually deploy to Azure, it will seamlessly switch to your Managed Redis!
//     builder.Services.AddStackExchangeRedisCache(options =>
//     {
//         options.Configuration = builder.Configuration.GetConnectionString("Redis");
//         options.InstanceName = "MarketCache_";
//     });
// }

builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJsCors", policy =>
    {
        policy.WithOrigins("http://localhost:3000",
                            "https://localhost:3000",
                            "https://erregeteygo.com")
                            .AllowAnyMethod()
                            .AllowAnyHeader()
                            .AllowCredentials();
    });
});

// 1. Controllers
builder.Services.AddControllers();

// 2. Bind MongoDB Configuration
builder.Services.Configure<MongoDBSettings>(
    builder.Configuration.GetSection("MongoDBSettings"));

// 3. Register MongoDB Data Service
builder.Services.AddSingleton<MarketDbService>();

// 4. Redis Cache (with fallback handling in controllers)
// builder.Services.AddStackExchangeRedisCache(options =>
// {
//     options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
//     options.InstanceName = "MarketCache_";
// });

// 5. HttpClient for worker ingestion (Typed Client for DI)
builder.Services.AddHttpClient();

// 6. Register Background ETL Service
builder.Services.AddHostedService<TcgCsvIngestionWorker>();

var app = builder.Build();

app.UseCors("NextJsCors");
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

app.Run();