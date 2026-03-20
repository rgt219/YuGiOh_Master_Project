using Azure.Storage.Blobs; // Fixes BlobContainerClient
using Confluent.Kafka;
using MongoDB.Bson;
using MongoDB.Driver;
using System;             // Fixes BinaryData and Guid

namespace YuGiOh_Analytics_Consumer
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly IConfiguration _configuration;
        private readonly BlobContainerClient _dlqContainerClient;
        private readonly IMongoCollection<BsonDocument> _analyticsCollection;
        private readonly IProducer<string, string> _uiProducer; // ADD THIS

        public Worker(ILogger<Worker> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            // ... Storage setup ...
            var connectionString = _configuration["AzureStorage:ConnectionString"];
            var containerName = _configuration["AzureStorage:ContainerName"];
            _dlqContainerClient = new BlobContainerClient(connectionString, containerName);

            // --- NEW: MongoDB Setup ---
            var mongoClient = new MongoClient(_configuration["CosmosDb:ConnectionString"]);
            var database = mongoClient.GetDatabase("YuGiOhAnalytics");
            _analyticsCollection = database.GetCollection<BsonDocument>("DeckStats");

            var producerConfig = new ProducerConfig
            {
                BootstrapServers = _configuration["Kafka:BootstrapServers"],
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = _configuration["Kafka:ConnectionString"]
            };
            _uiProducer = new ProducerBuilder<string, string>(producerConfig).Build();
        }

        private async Task ProcessDeckUpdate(string deckJson)
        {
            var document = BsonDocument.Parse(deckJson);
            var main = document.GetValue("mainDeck", new BsonArray()).AsBsonArray;
            var extra = document.GetValue("extraDeck", new BsonArray()).AsBsonArray;
            var side = document.GetValue("sideDeck", new BsonArray()).AsBsonArray;

            var allCardIds = main.Concat(extra).Concat(side)
                                .Select(x => x.AsString)
                                .ToList();

            _logger.LogInformation($"Processing analytics for {allCardIds.Count} total cards.");

            var cardCounts = allCardIds.GroupBy(id => id)
                                        .Select(group => new { Id = group.Key, Count = group.Count() });

            // --- ADD THIS LINE FOR THE BUCKET KEY ---
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

            foreach (var card in cardCounts)
            {
                var filter = Builders<BsonDocument>.Filter.Eq("_id", card.Id);

                // --- UPDATED LOGIC HERE ---
                var update = Builders<BsonDocument>.Update
                    .Inc("TotalUsage", card.Count)
                    .Inc($"DailyUsage.{today}", card.Count) // Tracking specific daily growth
                    .Set("LastSeen", DateTime.UtcNow);

                await _analyticsCollection.UpdateOneAsync(
                    filter,
                    update,
                    new UpdateOptions { IsUpsert = true }
                );
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var config = new ConsumerConfig
            {
                BootstrapServers = _configuration["Kafka:BootstrapServers"],
                GroupId = _configuration["Kafka:GroupId"],
                SecurityProtocol = SecurityProtocol.SaslSsl,
                SaslMechanism = SaslMechanism.Plain,
                SaslUsername = "$ConnectionString",
                SaslPassword = _configuration["Kafka:ConnectionString"],
                AutoOffsetReset = AutoOffsetReset.Earliest // Start from the beginning if it's a new group
            };

            using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
            consumer.Subscribe(_configuration["Kafka:Topic"]);

            _logger.LogInformation("Kafka Consumer started and waiting for messages...");

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    // Poll for new messages every 100ms
                    var result = consumer.Consume(stoppingToken);

                    if (result != null)
                    {
                        _logger.LogInformation($"Consumed message: {result.Message.Value}");

                        try
                        {
                            // 1. Process the actual DB Analytics
                            await ProcessDeckUpdate(result.Message.Value);

                            // 2. NEW: Trigger UI Notification for the Ticker
                            // We parse the incoming JSON to get the Deck Name or User
                            var deckData = BsonDocument.Parse(result.Message.Value);
                            var activity = new
                            {
                                Username = deckData.GetValue("username", "A Duelist").AsString,
                                Action = "published a new deck",
                                Timestamp = DateTime.UtcNow
                            };

                            await _uiProducer.ProduceAsync("ui-activity-log", new Message<string, string>
                            {
                                Value = System.Text.Json.JsonSerializer.Serialize(activity)
                            });
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to process deck. Sending to DLQ.");
                            await SendToDeadLetterQueue(result.Message.Value, ex.Message);
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Kafka Consumer is shutting down...");
            }
            finally
            {
                consumer.Close();
                _uiProducer.Flush(TimeSpan.FromSeconds(10)); // Ensure messages are sent
                _uiProducer.Dispose();
            }
        }

        private async Task SendToDeadLetterQueue(string messagePayload, string errorMessage)
        {
            try
            {
                // Ensure the container exists (useful for the first run)
                await _dlqContainerClient.CreateIfNotExistsAsync();

                // Create a unique filename based on time and a GUID
                string fileName = $"failed-deck-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid()}.json";
                var blobClient = _dlqContainerClient.GetBlobClient(fileName);

                // Optional: Wrap the payload with the error details for easier debugging
                var deadLetterData = new
                {
                    Error = errorMessage,
                    Timestamp = DateTime.UtcNow,
                    Payload = messagePayload
                };

                await blobClient.UploadAsync(BinaryData.FromObjectAsJson(deadLetterData));
                _logger.LogWarning($"Message diverted to DLQ: {fileName}");
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "FATAL: Could not send message to DLQ. Data may be lost.");
            }
        }
    }
}
