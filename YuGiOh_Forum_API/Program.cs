using Microsoft.AspNetCore.Builder;
using YuGiOh_Forum_API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ForumDbService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "https://erregeteygo.com",
                "https://www.erregeteygo.com"
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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "YuGiOh Forum API v1");
        c.RoutePrefix = string.Empty;
    });
}
app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapGet("/", () => "FORUM API!");

app.MapControllers();

app.Run();