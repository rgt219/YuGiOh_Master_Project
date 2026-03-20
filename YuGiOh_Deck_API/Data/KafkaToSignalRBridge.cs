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
            var config = new ConsumerConfig { /* ... your existing config ... */ };
            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe("ui-activity-log");

            while (!stoppingToken.IsCancellationRequested)
            {
                Console.WriteLine("=============SECOND TRY BLOCK=============");
                try
                {
                    // 3. Use a timeout so we don't block the thread forever
                    var result = consumer.Consume(TimeSpan.FromSeconds(1));

                    if (result == null) continue; // No message? Just loop.

                    var activity = JsonSerializer.Deserialize<object>(result.Message.Value);
                    await _hubContext.Clients.All.SendAsync("ReceiveActivity", activity, stoppingToken);
                }
                catch (ConsumeException ex)
                {
                    Console.WriteLine($"Kafka Consume Error: {ex.Error.Reason}");
                    await Task.Delay(2000, stoppingToken);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FATAL Bridge Error: {ex.Message}");
        }
    }
}