using Azure.Storage.Blobs; // Fixes BlobContainerClient
using Confluent.Kafka;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using System;             // Fixes BinaryData and Guid
using System.Text.Json;
using System.Text.Json.Serialization;
using YuGiOh.ServiceDefaults;

namespace YuGiOh_Analytics_Consumer
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly IConfiguration _configuration;
        private readonly BlobContainerClient _dlqContainerClient;
        private readonly IMongoCollection<BsonDocument> _analyticsCollection;
        private readonly IMongoCollection<UserActivityDto> _activityCollection; // Added for strongly-typed DTO saving
        private readonly IProducer<string, string> _uiProducer;
        private IConsumer<Ignore, string>? _consumer;

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
            _analyticsCollection = database.GetCollection<BsonDocument>("CardUsageStats");
            _activityCollection = database.GetCollection<UserActivityDto>("DeckStats");

            var producerConfig = KafkaConnection.Apply(new ProducerConfig(), _configuration);
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
                                .Where(id => !string.IsNullOrEmpty(id) && id != "0")
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
            // Consume() blocks. Step off the startup path first so the web host (health endpoints) can start too.
            await Task.Yield();

            var config = KafkaConnection.Apply(new ConsumerConfig
            {
                GroupId = _configuration["Kafka:GroupId"],
                AutoOffsetReset = AutoOffsetReset.Earliest // Start from the beginning if it's a new group
            }, _configuration);

            using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
            consumer.Subscribe(_configuration["Kafka:Topic"]);

            _logger.LogInformation("Kafka Consumer started and waiting for messages...");

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    ConsumeResult<Ignore, string>? result = null;

                    try
                    {
                        // FIX: Use active local consumer variable
                        result = consumer.Consume(stoppingToken);

                        if (result?.Message?.Value != null)
                        {
                            // Continues the trace of the request that published this deck update.
                            using var span = KafkaTracing.StartProcess(result, config.GroupId ?? "");
                            try
                            {
                                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                                var activity = JsonSerializer.Deserialize<UserActivityDto>(result.Message.Value, options);

                                if (activity != null)
                                {
                                    activity.Id = Guid.NewGuid().ToString();

                                    // 1. Save live activity log directly into YuGiOhAnalytics.DeckStats
                                    await _activityCollection.InsertOneAsync(activity, cancellationToken: stoppingToken);
                                    _logger.LogInformation($"[MONGO_SUCCESS] Activity saved for deck: {activity.Title} by {activity.UserName}");

                                    // 2. Aggregate card frequency stats into MongoDB
                                    await ProcessDeckUpdate(result.Message.Value);
                                }
                            }
                            catch (Exception ex)
                            {
                                KafkaTracing.RecordError(span, ex);   // the failure shows up red on the trace
                                throw;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Worker Error: {ex.Message}");
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

    public class UserActivityDto
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("userName")]
        [JsonPropertyName("userName")]
        public string? UserName { get; set; }

        [BsonElement("userId")]
        [JsonPropertyName("userId")]
        public string? UserId { get; set; }

        [BsonElement("title")]
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [BsonElement("action")]
        [JsonPropertyName("action")]
        public string? Action { get; set; } = "published";

        [BsonElement("mainDeck")]
        [JsonPropertyName("mainDeck")]
        public List<string>? MainDeck { get; set; } = new();

        [BsonElement("extraDeck")]
        [JsonPropertyName("extraDeck")]
        public List<string>? ExtraDeck { get; set; } = new();

        [BsonElement("sideDeck")]
        [JsonPropertyName("sideDeck")]
        public List<string>? SideDeck { get; set; } = new();

        [BsonElement("timestamp")]
        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}