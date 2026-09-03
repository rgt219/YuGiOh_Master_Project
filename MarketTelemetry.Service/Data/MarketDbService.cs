using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MarketTelemetry.Service.Models;

namespace MarketTelemetry.Service.Data
{
    public class ComprehensiveCardAnalytics
    {
        public required string CardId { get; set; }
        public List<FormatStat> FormatStats { get; set; } = new();
        public List<ContainingDeckDto> ContainingDecks { get; set; } = new();
    }

    public class FormatStat
    {
        public required string Format { get; set; }
        public int DeckCount { get; set; }
        public int TotalDecksInFormat { get; set; }
        public double InclusionRate { get; set; }
        public int TotalCopies { get; set; }
        public double AvgCopies { get; set; }
    }

    public class ContainingDeckDto
    {
        public required string DeckId { get; set; }
        public required string Archetype { get; set; }
        public required string Format { get; set; }
        public required string Tier { get; set; }
        public required string Pilot { get; set; }
        public required string Placement { get; set; }
        public int Copies { get; set; }
    }

    public class CardAnalytics
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("cardId")]
        public required string CardId { get; set; }

        [BsonElement("format")]
        public required string Format { get; set; }

        [BsonElement("deckCount")]
        public int DeckCount { get; set; }

        [BsonElement("totalDecksInFormat")]
        public int TotalDecksInFormat { get; set; }

        [BsonElement("inclusionRate")]
        public double InclusionRate { get; set; }

        [BsonElement("totalCopies")]
        public int TotalCopies { get; set; }

        [BsonElement("avgCopies")]
        public double AvgCopies { get; set; }

        [BsonElement("lastUpdated")]
        public DateTime LastUpdated { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class MetaDeckDocument
    {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public required string Id { get; set; }

        [BsonElement("archetype")]
        public required string Archetype { get; set; }

        [BsonElement("format")]
        public required string Format { get; set; }

        [BsonElement("tier")]
        public required string Tier { get; set; }

        [BsonElement("pilot")]
        public required string Pilot { get; set; }

        [BsonElement("placement")]
        public required string Placement { get; set; }

        [BsonElement("sampleDeck")]
        public required SampleDeckSample SampleDeck { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class SampleDeckSample
    {
        [BsonElement("mainDeck")]
        public List<string> MainDeck { get; set; } = new();

        [BsonElement("extraDeck")]
        public List<string> ExtraDeck { get; set; } = new();

        [BsonElement("sideDeck")]
        public List<string> SideDeck { get; set; } = new();
    }

    public class MarketDbService
    {
        private readonly IMongoDatabase _marketDatabase;
        private readonly IMongoDatabase _decklistDatabase;
        private readonly IMongoCollection<MarketSnapshot> _metricsCollection;
        private readonly IMongoCollection<SetCatalog> _setCatalogCollection;
        private readonly IMongoCollection<CardAnalytics> _cardAnalyticsCollection;
        private readonly IMongoCollection<MetaDeckDocument> _metaDecksCollection;

        public MarketDbService(IOptions<MongoDBSettings> mongoDBSettings)
        {
            var client = new MongoClient(mongoDBSettings.Value.ConnectionURI);

            // 1. Market database for pricing & catalogs
            _marketDatabase = client.GetDatabase(mongoDBSettings.Value.DatabaseName);
            _metricsCollection = _marketDatabase.GetCollection<MarketSnapshot>("MarketMetrics");
            _setCatalogCollection = _marketDatabase.GetCollection<SetCatalog>("SetCatalog");

            // 2. Explicitly target the "Decklists" database where MetaDecks & CardAnalytics reside
            _decklistDatabase = client.GetDatabase("Decklists");
            _cardAnalyticsCollection = _decklistDatabase.GetCollection<CardAnalytics>("CardAnalytics");
            _metaDecksCollection = _decklistDatabase.GetCollection<MetaDeckDocument>("MetaDecks");

            try
            {
                var indexKeys = Builders<MarketSnapshot>.IndexKeys
                    .Ascending(x => x.ProductId)
                    .Descending(x => x.Timestamp);
                _metricsCollection.Indexes.CreateOne(new CreateIndexModel<MarketSnapshot>(indexKeys));

                var setNameDateIndex = Builders<MarketSnapshot>.IndexKeys
                    .Ascending(x => x.SetName)
                    .Descending(x => x.Timestamp);
                _metricsCollection.Indexes.CreateOne(new CreateIndexModel<MarketSnapshot>(setNameDateIndex));

                var setIndex = Builders<SetCatalog>.IndexKeys.Descending(x => x.GroupId);
                _setCatalogCollection.Indexes.CreateOne(new CreateIndexModel<SetCatalog>(setIndex));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[INDEX_CREATION_WARNING]: {ex.Message}");
            }
        }

        public async Task<bool> IsSetIngestedTodayAsync(string setName)
        {
            var today = DateTime.UtcNow.Date;
            var filter = Builders<MarketSnapshot>.Filter.And(
                Builders<MarketSnapshot>.Filter.Eq(x => x.SetName, setName),
                Builders<MarketSnapshot>.Filter.Gte(x => x.Timestamp, today)
            );

            return await _metricsCollection.Find(filter).AnyAsync();
        }

        public async Task SaveSnapshotsBulkAsync(List<MarketSnapshot> snapshots)
        {
            if (snapshots == null || !snapshots.Any()) return;

            int batchSize = 50;

            for (int i = 0; i < snapshots.Count; i += batchSize)
            {
                var batch = snapshots.Skip(i).Take(batchSize).ToList();
                if (!batch.Any()) continue;

                var updates = new List<WriteModel<MarketSnapshot>>();

                foreach (var snapshot in batch)
                {
                    var filter = Builders<MarketSnapshot>.Filter.And(
                        Builders<MarketSnapshot>.Filter.Eq(x => x.ProductId, snapshot.ProductId),
                        Builders<MarketSnapshot>.Filter.Eq(x => x.Timestamp, snapshot.Timestamp)
                    );

                    updates.Add(new ReplaceOneModel<MarketSnapshot>(filter, snapshot)
                    {
                        IsUpsert = true
                    });
                }

                bool batchSuccess = false;
                int retries = 0;

                while (!batchSuccess && retries < 10)
                {
                    try
                    {
                        await _metricsCollection.BulkWriteAsync(updates, new BulkWriteOptions { IsOrdered = false });
                        batchSuccess = true;
                    }
                    catch (MongoBulkWriteException ex) when (ex.WriteErrors.Any(e => e.Code == 16500))
                    {
                        retries++;
                        if (retries >= 10) throw;
                        await Task.Delay(500 * retries);
                    }
                    catch (Exception)
                    {
                        retries++;
                        if (retries >= 10) throw;
                        await Task.Delay(500 * retries);
                    }
                }
            }
        }

        public async Task<List<MarketSnapshot>> GetHistoricalPricesAsync(int productId, int days)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);

            var filter = Builders<MarketSnapshot>.Filter.And(
                Builders<MarketSnapshot>.Filter.Eq(x => x.ProductId, productId),
                Builders<MarketSnapshot>.Filter.Gte(x => x.Timestamp, cutoffDate)
            );

            return await _metricsCollection
                .Find(filter)
                .SortBy(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task SaveSetCatalogAsync(SetCatalog setCatalog)
        {
            var filter = Builders<SetCatalog>.Filter.Eq(x => x.GroupId, setCatalog.GroupId);
            await _setCatalogCollection.ReplaceOneAsync(filter, setCatalog, new ReplaceOptions { IsUpsert = true });
        }

        public async Task<List<SetCatalog>> GetSetsAsync(int page, int limit)
        {
            int skip = (page - 1) * limit;

            return await _setCatalogCollection
                .Find(_ => true)
                .SortByDescending(x => x.GroupId)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<List<MarketSnapshot>> GetLatestCardsBySetAsync(string setName)
        {
            try
            {
                var setRecords = await _metricsCollection
                    .Find(x => x.SetName == setName)
                    .ToListAsync();

                if (setRecords == null || !setRecords.Any()) return new List<MarketSnapshot>();

                var validRecords = setRecords
                    .Where(x => x.Timestamp > DateTime.MinValue.AddDays(1))
                    .ToList();

                if (!validRecords.Any()) return new List<MarketSnapshot>();

                var latestDate = validRecords.Max(x => x.Timestamp).Date;

                return validRecords
                    .Where(x => x.Timestamp.Date == latestDate)
                    .GroupBy(c => c.ProductId)
                    .Select(g => g.First())
                    .OrderByDescending(c => c.MarketPrice ?? 0m)
                    .ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET_SET_CARDS_ERROR]: {ex.Message}");
                return new List<MarketSnapshot>();
            }
        }

        public async Task<CardAnalytics?> GetCardAnalyticsByKonamiIdAsync(string konamiId, string format)
        {
            var filter = Builders<CardAnalytics>.Filter.And(
                Builders<CardAnalytics>.Filter.Eq(x => x.CardId, konamiId),
                Builders<CardAnalytics>.Filter.Regex(x => x.Format, new BsonRegularExpression($"^{format}$", "i"))
            );

            var analytics = await _cardAnalyticsCollection.Find(filter).FirstOrDefaultAsync();
            if (analytics != null) return analytics;

            var decksInFormat = await _metaDecksCollection.Find(x => x.Format.ToLower() == format.ToLower()).ToListAsync();
            int totalDecks = decksInFormat.Count;

            if (totalDecks == 0) return null;

            int decksContainingCard = 0;
            int totalCopies = 0;

            foreach (var deck in decksInFormat)
            {
                var allCards = new List<string>();
                if (deck.SampleDeck?.MainDeck != null) allCards.AddRange(deck.SampleDeck.MainDeck);
                if (deck.SampleDeck?.ExtraDeck != null) allCards.AddRange(deck.SampleDeck.ExtraDeck);
                if (deck.SampleDeck?.SideDeck != null) allCards.AddRange(deck.SampleDeck.SideDeck);

                int copiesInThisDeck = allCards.Count(id => id == konamiId);
                if (copiesInThisDeck > 0)
                {
                    decksContainingCard++;
                    totalCopies += copiesInThisDeck;
                }
            }

            if (decksContainingCard == 0) return null;

            return new CardAnalytics
            {
                CardId = konamiId,
                Format = format,
                DeckCount = decksContainingCard,
                TotalDecksInFormat = totalDecks,
                InclusionRate = Math.Round((double)decksContainingCard / totalDecks * 100, 1),
                TotalCopies = totalCopies,
                AvgCopies = Math.Round((double)totalCopies / decksContainingCard, 2)
            };
        }

        public async Task<ComprehensiveCardAnalytics> GetComprehensiveAnalyticsAsync(string konamiId)
        {
            var allDecks = await _metaDecksCollection.Find(_ => true).ToListAsync();
            var formatGroups = allDecks.GroupBy(d => string.IsNullOrEmpty(d.Format) ? "Unknown" : d.Format);

            var formatStats = new List<FormatStat>();
            var containingDecks = new List<ContainingDeckDto>();

            foreach (var group in formatGroups)
            {
                string formatName = group.Key;
                var decksInFormat = group.ToList();
                int totalDecks = decksInFormat.Count;

                int decksContainingCard = 0;
                int totalCopies = 0;

                foreach (var deck in decksInFormat)
                {
                    var allCards = new List<string>();
                    if (deck.SampleDeck?.MainDeck != null) allCards.AddRange(deck.SampleDeck.MainDeck);
                    if (deck.SampleDeck?.ExtraDeck != null) allCards.AddRange(deck.SampleDeck.ExtraDeck);
                    if (deck.SampleDeck?.SideDeck != null) allCards.AddRange(deck.SampleDeck.SideDeck);

                    int copiesInThisDeck = allCards.Count(id => id?.Trim() == konamiId?.Trim());
                    if (copiesInThisDeck > 0)
                    {
                        decksContainingCard++;
                        totalCopies += copiesInThisDeck;

                        containingDecks.Add(new ContainingDeckDto
                        {
                            DeckId = deck.Id,
                            Archetype = deck.Archetype ?? "Unknown Archetype",
                            Format = formatName,
                            Tier = deck.Tier ?? "N/A",
                            Pilot = deck.Pilot ?? "Unknown Pilot",
                            Placement = deck.Placement ?? "Tournament Entry",
                            Copies = copiesInThisDeck
                        });
                    }
                }

                formatStats.Add(new FormatStat
                {
                    Format = formatName,
                    DeckCount = decksContainingCard,
                    TotalDecksInFormat = totalDecks,
                    InclusionRate = totalDecks > 0 ? Math.Round((double)decksContainingCard / totalDecks * 100, 1) : 0,
                    TotalCopies = totalCopies,
                    AvgCopies = decksContainingCard > 0 ? Math.Round((double)totalCopies / decksContainingCard, 2) : 0
                });
            }

            return new ComprehensiveCardAnalytics
            {
                CardId = konamiId,
                FormatStats = formatStats,
                ContainingDecks = containingDecks.OrderByDescending(d => d.Copies).ToList()
            };
        }
    }
}