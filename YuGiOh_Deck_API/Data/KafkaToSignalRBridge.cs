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
        var connString = _config["Kafka:ConnectionString"];
        if (string.IsNullOrEmpty(connString))
        {
            // This prevents the 500 crash and lets the API keep running
            Console.WriteLine("CRITICAL: Kafka ConnectionString is missing. Bridge will not start.");
            return;
        }
        var config = new ConsumerConfig
        {
            BootstrapServers = _config["Kafka:BootstrapServers"],
            GroupId = "api-signalr-bridge",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            SecurityProtocol = SecurityProtocol.SaslSsl,
            SaslMechanism = SaslMechanism.Plain,
            SaslUsername = "$ConnectionString",
            SaslPassword = _config["Kafka:ConnectionString"]
        };

        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe("ui-activity-log"); // Ensure this matches your worker's output topic

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(stoppingToken);
                // The message from the worker usually looks like: { "username": "...", "title": "...", "action": "..." }
                var activity = JsonSerializer.Deserialize<object>(result.Message.Value);

                // This is the magic line that hits your React connection.on("ReceiveActivity")
                await _hubContext.Clients.All.SendAsync("ReceiveActivity", activity, stoppingToken);

                Console.WriteLine($"[SIGNALR] Broadcasted activity for {result.Message.Key}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Bridge Error: {ex.Message}");
                await Task.Delay(5000, stoppingToken);
            }
        }
    }
}