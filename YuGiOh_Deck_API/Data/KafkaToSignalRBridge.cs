using Confluent.Kafka;
using Microsoft.AspNetCore.SignalR;
using YuGiOhDeckApi.Hubs;
using System.Text.Json;
// using YuGiOh_Analytics_Consumer;

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
                BootstrapServers = _config["Kafka:BootstrapServers"], // Should be ygoevents.servicebus.windows.net:9093

                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString", // Literal string
                SaslPassword = _config["Kafka:ConnectionString"], // The long Endpoint=sb://... string

                // Add this to help with connection stability in Azure
                SessionTimeoutMs = 45000,
                SslEndpointIdentificationAlgorithm = SslEndpointIdentificationAlgorithm.Https,
                BrokerAddressFamily = BrokerAddressFamily.Any
            };


            Console.WriteLine("=============CREATING CONSUMER=============");
            using var consumer = new ConsumerBuilder<string, string>(config)
                .SetErrorHandler((_, e) => Console.WriteLine($"Kafka Connection Error Detail: {e.Reason}"))
                .SetLogHandler((_, l) => Console.WriteLine($"Kafka Log: {l.Message}"))
                .Build();
            consumer.Subscribe("deck-updates");

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

                // ONLY enter this block if Kafka actually has a message for us
                if (result?.Message?.Value != null)
                {
                    Console.WriteLine("!!! DATA RECEIVED FROM KAFKA !!!");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var activity = JsonSerializer.Deserialize<UserActivityDto>(result.Message.Value, options);

                    if (activity != null)
                    {
                        await _hubContext.Clients.All.SendAsync("ReceiveActivity", activity, stoppingToken);
                        Console.WriteLine($"[SIGNALR] Success: {activity.Username} {activity.Action} {activity.Title}");
                    }
                }
                else
                {
                    Console.WriteLine("NO NO NO");
                }
                // DELETE THE "ELSE" LOGS. 
                // If nothing is in Kafka, the loop just restarts silently.
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FATAL Bridge Error: {ex.Message}");
        }
    }
}

// public class UserActivityDto
// {
//     public string Username { get; set; } = "Unknown";
//     public string Title { get; set; } = "New Deck";
//     public string Action { get; set; } = "published";
// }