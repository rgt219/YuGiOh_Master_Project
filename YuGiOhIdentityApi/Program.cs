using YuGiOhIdentityApi.Services;
using YuGiOhIdentityApi.Models;
using Microsoft.ApplicationInsights.AspNetCore;
//Comment for pushing

namespace YuGiOhIdentityApi
{
    public partial class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // 1. SERVICES CONFIGURATION
            builder.Services.Configure<MongoDBUserSettings>(builder.Configuration.GetSection("MongoDBUsers"));
            builder.Services.AddSingleton<UserRegistrationService>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("MyCors", policy =>
                {
                    policy.WithOrigins("http://localhost:3000")
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
            builder.Services.AddApplicationInsightsTelemetry();

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
            app.MapControllers();

            app.Run();
        }
    }
}