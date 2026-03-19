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
        }

        private async Task ProcessDeckUpdate(string deckJson)
        {
            // 1. Parse the JSON coming from the Event Hub
            // Expected Format: { "DeckId": "...", "Cards": [{ "Id": "123", "Name": "Dark Magician" }, ...] }
            var document = BsonDocument.Parse(deckJson);
            var cards = document["Cards"].AsBsonArray;

            _logger.LogInformation($"Processing analytics for {cards.Count} cards in deck.");

            foreach (var card in cards)
            {
                var cardId = card["Id"].AsString;
                var cardName = card["Name"].AsString;

                // 2. Define the Filter: Find the document for this specific Card ID
                var filter = Builders<BsonDocument>.Filter.Eq("Id", cardId);

                // 3. Define the Update: 
                // $inc: Increments the usage count by 1
                // $set: Updates the timestamp
                // $setOnInsert: Only sets the CardName if this is a brand new entry
                var update = Builders<BsonDocument>.Update
                    .Inc("TotalUsage", 1)
                    .Set("LastSeen", DateTime.UtcNow)
                    .SetOnInsert("CardName", cardName);

                // 4. Execute with Upsert = true
                // This ensures if the card isn't in our DB yet, it gets created automatically
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

                        // --- START OF DLQ LOGIC ---
                        try
                        {
                            // This is where you call your actual processing method
                            await ProcessDeckUpdate(result.Message.Value);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to process deck. Sending to DLQ.");

                            // This will be implemented once we set up the BlobServiceClient
                            await SendToDeadLetterQueue(result.Message.Value, ex.Message);
                        }
                        // --- END OF DLQ LOGIC ---
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
