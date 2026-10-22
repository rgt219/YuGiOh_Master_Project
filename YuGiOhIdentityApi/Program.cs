using YuGiOhIdentityApi.Services;
using YuGiOhIdentityApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using YuGiOhIdentityApi.Repositories;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using YuGiOh.ServiceDefaults;
//Comment for pushing

namespace YuGiOhIdentityApi
{
    public static partial class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Traces, metrics and logs (see Shared/YuGiOh.ServiceDefaults). Health probes are left out of traces.
            builder.AddServiceTelemetry("identity-api")
                .WithTracing(tracing => tracing.AddAspNetCoreInstrumentation(o => o.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/health")))
                .WithMetrics(metrics => metrics.AddAspNetCoreInstrumentation());

            // Health: /health/live and /health/ready for Azure's probes, /health (every dependency) for the status page.
            builder.AddServiceHealthChecks()
                .AddMongoCheck("MongoDBUsers:ConnectionURI");

            // 1. SERVICES CONFIGURATION
            builder.Services.Configure<MongoDBUserSettings>(builder.Configuration.GetSection("MongoDBUsers"));
            builder.Services.AddSingleton<UserRegistrationService>();
            builder.Services.AddTransient<IEmailService, EmailService>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("MyCors", policy =>
                {
                    policy.WithOrigins("https://frontend.happybush-e43d89b2.eastus.azurecontainerapps.io",
                                       "https://erregeteygo.com",
                                       "https://www.erregeteygo.com",
                                       "https://localhost:3000",
                                       "http://localhost:3000")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            builder.Services.AddScoped<UserRegistrationService>();
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // 2. BUILD THE APP
            var app = builder.Build();

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

            app.MapGet("/", () => "Hello World from Identity!");
            app.MapServiceHealthChecks();
            app.MapControllers();

            app.Run();
        }
    }
}