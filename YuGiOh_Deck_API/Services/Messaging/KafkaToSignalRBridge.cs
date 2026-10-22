using Confluent.Kafka;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using YuGiOhDeckApi.Hubs;
using YuGiOh_Analytics_Consumer;
using YuGiOh.ServiceDefaults;

namespace YuGiOhDeckApi.Services
{
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
            if (!KafkaConnection.IsConfigured(_config)) return;

            var config = KafkaConnection.Apply(new ConsumerConfig
            {
                GroupId = "signalr-consumer",
                AutoOffsetReset = AutoOffsetReset.Latest
            }, _config);

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
                        // Continues the trace of the request that published this deck update.
                        using var activity = KafkaTracing.StartProcess(consumeResult, config.GroupId);

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
                                action = string.IsNullOrWhiteSpace(parsed.Action) ? "published" : parsed.Action,
                                mainDeck = parsed.MainDeck ?? new List<string>(),
                                extraDeck = parsed.ExtraDeck ?? new List<string>()
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
}
