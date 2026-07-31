using Confluent.Kafka;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using YuGiOhDeckApi.Hubs;
using YuGiOh_Analytics_Consumer;


public class KafkaToSignalRBridge : BackgroundService
{
    private readonly IConfiguration _config;
    private readonly IHubContext<ActivityHub> _hubContext;
    private static readonly ConcurrentQueue<object> _recentActivities = new();

    public static List<object> GetRecentActivities()
    {
        return _recentActivities.Reverse().ToList();
    }

    public KafkaToSignalRBridge(IConfiguration config, IHubContext<ActivityHub> hubContext)
    {
        _config = config;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        var connString = _config["Kafka:ConnectionString"];
        if (string.IsNullOrEmpty(connString)) return;

        var config = new ConsumerConfig
        {
            GroupId = "bridge-v" + Guid.NewGuid().ToString()[..4],
            BootstrapServers = _config["Kafka:BootstrapServers"],
            SecurityProtocol = SecurityProtocol.SaslSsl,
            SaslMechanism = SaslMechanism.Plain,
            SaslUsername = "$ConnectionString",
            SaslPassword = connString,
            AutoOffsetReset = AutoOffsetReset.Latest
        };

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe("deck-updates");

        // 🚀 CRITICAL: Case-insensitive deserialization options
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var consumeResult = consumer.Consume(stoppingToken);
                if (consumeResult?.Message?.Value != null)
                {
                    var rawJson = consumeResult.Message.Value;

                    // Deserialize with case-insensitive option
                    var parsed = JsonSerializer.Deserialize<UserActivityDto>(rawJson, jsonOptions);

                    if (parsed != null)
                    {
                        // 🚀 Fallback chain to guarantee display names
                        string displayUser = !string.IsNullOrWhiteSpace(parsed.UserName)
                            ? parsed.UserName
                            : (!string.IsNullOrWhiteSpace(parsed.UserId) ? parsed.UserId : "Anonymous");

                        string displayTitle = !string.IsNullOrWhiteSpace(parsed.Title)
                            ? parsed.Title
                            : "Unnamed Deck";

                        var payload = new
                        {
                            username = displayUser,
                            title = displayTitle,
                            action = string.IsNullOrWhiteSpace(parsed.Action) ? "published" : parsed.Action
                        };

                        // Add to static 5-item history queue
                        _recentActivities.Enqueue(payload);
                        while (_recentActivities.Count > 5) _recentActivities.TryDequeue(out _);

                        // Broadcast via SignalR
                        await _hubContext.Clients.All.SendAsync("ReceiveActivity", payload, stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Bridge Exception: {ex.Message}");
                await Task.Delay(3000, stoppingToken);
            }
        }
    }
}