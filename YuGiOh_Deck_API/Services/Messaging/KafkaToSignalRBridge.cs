using Confluent.Kafka;
using Microsoft.AspNetCore.SignalR;
using YuGiOhDeckApi.Hubs;
using System.Text.Json;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

public class KafkaToSignalRBridge : BackgroundService
{
    private readonly IConfiguration _config;
    private readonly IHubContext<ActivityHub> _hubContext;

    // 🚀 Thread-safe buffer holding max 5 recent activities
    private static readonly ConcurrentQueue<UserActivityDto> _recentActivities = new();

    public static List<UserActivityDto> GetRecentActivities()
    {
        return _recentActivities.Reverse().ToList(); // Newest first
    }

    public KafkaToSignalRBridge(IConfiguration config, IHubContext<ActivityHub> hubContext)
    {
        _config = config;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Console.WriteLine("=============CALLING EXECUTE ASYNC=============");
        await Task.Yield();

        var connString = _config["Kafka:ConnectionString"];
        if (string.IsNullOrEmpty(connString))
        {
            Console.WriteLine("CRITICAL: Kafka ConnectionString is missing. Bridge skipping...");
            return;
        }

        try
        {
            var config = new ConsumerConfig
            {
                GroupId = "bridge-v" + Guid.NewGuid().ToString().Substring(0, 4),
                BootstrapServers = _config["Kafka:BootstrapServers"],
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = connString,
                AutoOffsetReset = AutoOffsetReset.Latest
            };

            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe("deck-updates");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var consumeResult = consumer.Consume(stoppingToken);
                    if (consumeResult?.Message?.Value != null)
                    {
                        var activity = JsonSerializer.Deserialize<UserActivityDto>(consumeResult.Message.Value);

                        if (activity != null)
                        {
                            if (string.IsNullOrEmpty(activity.Action)) activity.Action = "published";

                            // 🚀 Add to static buffer & trim to max 5 items
                            _recentActivities.Enqueue(activity);
                            while (_recentActivities.Count > 5)
                            {
                                _recentActivities.TryDequeue(out _);
                            }

                            // Broadcast live to connected SignalR clients
                            await _hubContext.Clients.All.SendAsync("ReceiveActivity", activity, stoppingToken);
                        }
                    }
                }
                catch (ConsumeException ex)
                {
                    Console.WriteLine($"Kafka temporarily unavailable: {ex.Error.Reason}");
                    await Task.Delay(5000, stoppingToken);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FATAL Bridge Error: {ex.Message}");
        }
    }
}