using Confluent.Kafka;
using Microsoft.AspNetCore.SignalR;
using YuGiOhDeckApi.Hubs;
using System.Text.Json;

public class KafkaToSignalRBridge : BackgroundService
{
    private readonly IConfiguration _config;
    private readonly IHubContext<ActivityHub> _hubContext;

    public KafkaToSignalRBridge(IConfiguration config, IHubContext<ActivityHub> hubContext)
    {
        _config = config;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 1. Give the API a chance to finish starting up first
        Console.WriteLine("=============CALLING EXECUTE ASYNC=============");
        await Task.Yield();

        var connString = _config["Kafka:ConnectionString"];
        Console.WriteLine("=============KAFKA CONNECTION STRING=============");
        Console.WriteLine(connString);
        if (string.IsNullOrEmpty(connString))
        {
            Console.WriteLine("CRITICAL: Kafka ConnectionString is missing. Bridge skipping...");
            return;
        }

        // 2. Wrap the consumer in a try/catch so a connection failure doesn't kill the API
        Console.WriteLine("=============TRY BLOCK=============");
        try
        {
            var config = new ConsumerConfig
            {
                GroupId = "api-signalr-bridge",
                BootstrapServers = _config["Kafka:BootstrapServers"],
                AutoOffsetReset = AutoOffsetReset.Earliest,

                // Security settings for Azure Event Hubs
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = _config["Kafka:ConnectionString"]
            };

            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe("ui-activity-log");

            // MOCK MESSAGE FOR TESTING
            var testActivity = new UserActivityDto
            {
                Username = "System",
                Action = "initialized",
                Title = "Live Ticker Online"
            };
            await _hubContext.Clients.All.SendAsync("ReceiveActivity", testActivity, stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                var result = consumer.Consume(TimeSpan.FromSeconds(1));
                try
                {
                    // 1. Poll Kafka for 1 second


                    if (result != null && !string.IsNullOrEmpty(result.Message.Value))
                    {
                        // 2. Map the JSON string to your DTO
                        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var activity = JsonSerializer.Deserialize<UserActivityDto>(result.Message.Value, options);

                        if (activity != null)
                        {
                            // 3. Broadcast to SignalR
                            // SignalR will automatically camelCase the properties for React
                            await _hubContext.Clients.All.SendAsync("ReceiveActivity", activity, stoppingToken);

                            Console.WriteLine($"[SIGNALR] Success: {activity.Username} {activity.Action} {activity.Title}");
                        }
                    }
                }
                catch (ConsumeException ex)
                {
                    Console.WriteLine($"Kafka Consume Error: {ex.Error.Reason}");
                    await Task.Delay(2000, stoppingToken);
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"JSON Parsing Error: {ex.Message} - Raw Data: {result?.Message?.Value}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FATAL Bridge Error: {ex.Message}");
        }
    }
}

public class UserActivityDto
{
    public string Username { get; set; } = "Unknown";
    public string Title { get; set; } = "New Deck";
    public string Action { get; set; } = "published";
}