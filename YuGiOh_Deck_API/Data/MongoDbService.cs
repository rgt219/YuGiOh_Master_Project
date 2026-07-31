using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Data
{
    public class MongoDbService : IMongoDbService
    {
        private readonly IMongoCollection<DeckList> _deckListCollection;
        private readonly IMongoCollection<MetaDeck> _metaDeckCollection;
        private readonly IMongoCollection<CardAnalytics> _cardAnalyticsCollection;
        private readonly IMongoCollection<BsonDocument> _usersCollection;
        private List<CardData> _masterCache = new();

        public MongoDbService(IOptions<MongoDBSettings> mongoDBSettings)
        {
            MongoClient client = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            IMongoDatabase database = client.GetDatabase(mongoDBSettings.Value.DatabaseName);

            _deckListCollection = database.GetCollection<DeckList>(mongoDBSettings.Value.CollectionName);
            _metaDeckCollection = database.GetCollection<MetaDeck>("MetaDecks");
            _cardAnalyticsCollection = database.GetCollection<CardAnalytics>("CardAnalytics");

            IMongoDatabase usersDatabase = client.GetDatabase(mongoDBSettings.Value.UsersDatabaseName);
            _usersCollection = usersDatabase.GetCollection<BsonDocument>("Users");



            // Fire and forget the cache loader
            _ = InitializeCardCache();
        }

        public async Task InitializeCardCache()
        {
            try
            {
                using var http = new HttpClient();
                // Increase timeout for the large 13k card payload
                http.Timeout = TimeSpan.FromMinutes(2);

                var result = await http.GetFromJsonAsync<YGOProResult>("https://db.ygoprodeck.com/api/v7/cardinfo.php");

                if (result?.Data != null)
                {
                    _masterCache = result.Data.Select(c => new CardData
                    {
                        Id = c.id,
                        Name = c.name,
                        Type = c.type,
                        Desc = c.desc,
                        Race = c.race,
                        Attribute = c.attribute,
                        Level = c.level,
                        Atk = c.atk,
                        Def = c.def,
                        // FIX: Use FirstOrDefault to safely get the image URL
                        Image = c.card_images?.FirstOrDefault()?.image_url_small ?? ""
                    }).ToList();

                    Console.WriteLine($"CACHE_INITIALIZED: {_masterCache.Count} cards cached.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CACHE_ERROR: {ex.Message}");
            }
        }

        public async Task<HydratedDeckResponse?> GetHydratedDeckAsync(string id)
        {
            // 1. If the cache hasn't loaded yet, force an initialization and wait for it.
            // This prevents the "Array(0)" issue on cold starts.
            if (_masterCache == null || !_masterCache.Any())
            {
                Console.WriteLine("CACHE_EMPTY: Initializing master card data before hydration...");
                await InitializeCardCache();
            }

            var thinDeck = await GetByIdAsync(id);
            if (thinDeck == null) return null;

            // 2. Perform the mapping
            var response = new HydratedDeckResponse
            {
                Id = thinDeck.Id,
                Title = thinDeck.Title,
                UserId = thinDeck.UserId,
                MainDeck = thinDeck.MainDeck?.Select(idStr =>
                    _masterCache.FirstOrDefault(c => c.Id.ToString() == idStr))
                    .Where(c => c != null).ToList()!,

                ExtraDeck = thinDeck.ExtraDeck?.Select(idStr =>
                    _masterCache.FirstOrDefault(c => c.Id.ToString() == idStr))
                    .Where(c => c != null).ToList()!,

                SideDeck = thinDeck.SideDeck?.Select(idStr =>
                    _masterCache.FirstOrDefault(c => c.Id.ToString() == idStr))
                    .Where(c => c != null).ToList()!
            };

            // 3. Debug logging to verify if we actually found anything
            Console.WriteLine($"HYDRATION_COMPLETE: Found {response.MainDeck.Count} cards for deck {id}");

            return response;
        }

        public async Task<DeckList> GetByIdAsync(string id) => await _deckListCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task CreateAsync(DeckList deckList) => await _deckListCollection.InsertOneAsync(deckList);
        public async Task UpdateByIdAsync(DeckList deck, string id) => await _deckListCollection.ReplaceOneAsync(x => x.Id == id, deck);
        public async Task DeleteByIdAsync(string id) => await _deckListCollection.DeleteOneAsync(x => x.Id == id);
        public async Task<List<DeckList>> GetByUserIdAsync(string userId) => await _deckListCollection.Find(x => x.UserId == userId).ToListAsync();

        public async Task<bool> DeleteUserDeckAsync(string deckId, string userId)
        {
            var filter = Builders<DeckList>.Filter.And(
                Builders<DeckList>.Filter.Eq(x => x.Id, deckId),
                Builders<DeckList>.Filter.Eq(x => x.UserId, userId)
            );
            var result = await _deckListCollection.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public async Task DeleteByTitleAsync(string title)
        {
            await _deckListCollection.DeleteOneAsync(x => x.Title.ToLower() == title.ToLower());
        }

        public async Task<IEnumerable<DeckList>> GetAsync()
        {
            return await _deckListCollection.Find(_ => true).ToListAsync();
        }

        public async Task SaveMetaDeckAsync(MetaDeck metaDeck)
        {
            var filter = Builders<MetaDeck>.Filter.Eq(x => x.Id, metaDeck.Id);

            // ReplaceOneAsync with IsUpsert = true will insert the document if it doesn't exist,
            // or update it if a document with the same Id already exists.
            await _metaDeckCollection.ReplaceOneAsync(
                filter,
                metaDeck,
                new ReplaceOptions { IsUpsert = true }
            );
        }

        public async Task<List<MetaDeck>> GetMetaDecksAsync(string? format = null)
        {
            if (string.IsNullOrWhiteSpace(format))
            {
                return await _metaDeckCollection.Find(_ => true).ToListAsync();
            }

            // Regex.Escape ensures characters like '(' or ')' don't break the regex engine
            string safeFormat = Regex.Escape(format.Trim());

            var filter = Builders<MetaDeck>.Filter.Regex(
                d => d.Format,
                new BsonRegularExpression($"^{safeFormat}$", "i")
            );

            return await _metaDeckCollection.Find(filter).ToListAsync();
        }

        public async Task<MetaDeck?> GetMetaDeckByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;

            // Filter by Id property or Mongo's internal _id string
            var filter = Builders<MetaDeck>.Filter.Or(
                Builders<MetaDeck>.Filter.Eq(d => d.Id, id),
                Builders<MetaDeck>.Filter.Eq("_id", id)
            );

            return await _metaDeckCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task SaveMetaDecksBulkAsync(List<MetaDeck> metaDecks)
        {
            // 1. Wipe out old stale meta deck records
            await _metaDeckCollection.DeleteManyAsync(_ => true);

            // 2. Insert the fresh batch
            if (metaDecks != null && metaDecks.Any())
            {
                await _metaDeckCollection.InsertManyAsync(metaDecks);
            }
        }

        public async Task<List<CardAnalytics>> GetTrendingCardsAsync(string format, int limit = 18)
        {
            string safeFormat = Regex.Escape(format.Trim());
            var filter = Builders<CardAnalytics>.Filter.Regex(
                c => c.Format,
                new BsonRegularExpression($"^{safeFormat}$", "i")
            );

            // 1. Fetch matching format cards from Cosmos DB (no database-side multi-sort)
            var formatCards = await _cardAnalyticsCollection
                .Find(filter)
                .ToListAsync();

            // 2. Sort in C# memory and take the top N
            return formatCards
                .OrderByDescending(c => c.DeckCount)
                .ThenByDescending(c => c.TotalCopies)
                .Take(limit)
                .ToList();
        }

        public async Task RecomputeCardAnalyticsAsync()
        {
            var allDecks = await _metaDeckCollection.Find(_ => true).ToListAsync();

            if (!allDecks.Any()) return;

            // Group decks by Format (e.g., TCG, OCG, MASTER DUEL, GENESYS)
            var groupedDecks = allDecks
                .Where(d => !string.IsNullOrWhiteSpace(d.Format))
                .GroupBy(d => d.Format.Trim().ToUpper());

            var aggregatedAnalytics = new List<CardAnalytics>();

            foreach (var group in groupedDecks)
            {
                string formatKey = group.Key;
                var formatDecks = group.ToList();
                int totalDecks = formatDecks.Count;

                // Dictionary: CardId -> (Unique Deck Count, Total Copies across all decks)
                var cardStats = new Dictionary<string, (int DeckCount, int TotalCopies)>();

                foreach (var deck in formatDecks)
                {
                    var sample = deck.SampleDeck;
                    if (sample == null) continue;

                    var main = sample.MainDeck ?? new List<string>();
                    var extra = sample.ExtraDeck ?? new List<string>();
                    var side = sample.SideDeck ?? new List<string>();

                    var allCards = main.Concat(extra).Concat(side).ToList();
                    var uniqueCardsInDeck = new HashSet<string>(allCards);

                    // Track unique deck inclusion
                    foreach (var cardId in uniqueCardsInDeck)
                    {
                        if (string.IsNullOrWhiteSpace(cardId)) continue;
                        if (!cardStats.ContainsKey(cardId))
                        {
                            cardStats[cardId] = (0, 0);
                        }
                        var current = cardStats[cardId];
                        cardStats[cardId] = (current.DeckCount + 1, current.TotalCopies);
                    }

                    // Track total copies run
                    foreach (var cardId in allCards)
                    {
                        if (string.IsNullOrWhiteSpace(cardId) || !cardStats.ContainsKey(cardId)) continue;
                        var current = cardStats[cardId];
                        cardStats[cardId] = (current.DeckCount, current.TotalCopies + 1);
                    }
                }

                // Generate analytics documents for this format
                foreach (var (cardId, stats) in cardStats)
                {
                    double inclusionRate = Math.Round(((double)stats.DeckCount / totalDecks) * 100, 1);
                    double avgCopies = Math.Round((double)stats.TotalCopies / stats.DeckCount, 1);

                    aggregatedAnalytics.Add(new CardAnalytics
                    {
                        CardId = cardId,
                        Format = formatKey,
                        DeckCount = stats.DeckCount,
                        TotalDecksInFormat = totalDecks,
                        InclusionRate = inclusionRate,
                        TotalCopies = stats.TotalCopies,
                        AvgCopies = avgCopies,
                        LastUpdated = DateTime.UtcNow
                    });
                }
            }

            // Atomically replace collection contents with fresh aggregates
            await _cardAnalyticsCollection.DeleteManyAsync(_ => true);
            if (aggregatedAnalytics.Any())
            {
                await _cardAnalyticsCollection.InsertManyAsync(aggregatedAnalytics);
            }
        }

        public async Task<List<DeckList>> GetRecentDecksAsync(int limit = 5)
        {
            // Fetch decks from MongoDB collection
            var decks = await _deckListCollection.Find(_ => true).ToListAsync();

            // Sort by Id descending (newest ObjectIds first) and take the limit
            return decks
                .OrderByDescending(d => d.Id)
                .Take(limit)
                .ToList();
        }

        public async Task<string> GetUsernameByUserIdAsync(string? userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return "Anonymous";

            try
            {
                // Build filter matching _id (tries ObjectId first, falls back to string matching)
                FilterDefinition<BsonDocument> filter;
                if (ObjectId.TryParse(userId, out var objectId))
                {
                    filter = Builders<BsonDocument>.Filter.Eq("_id", objectId);
                }
                else
                {
                    filter = Builders<BsonDocument>.Filter.Eq("_id", userId);
                }

                var userDoc = await _usersCollection.Find(filter).FirstOrDefaultAsync();

                if (userDoc != null)
                {
                    // Check possible case variations for username field in UserRegistration
                    if (userDoc.Contains("username")) return userDoc["username"].AsString;
                    if (userDoc.Contains("Username")) return userDoc["Username"].AsString;
                    if (userDoc.Contains("userName")) return userDoc["userName"].AsString;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[USERS_DB_LOOKUP_ERROR]: {ex.Message}");
            }

            return "Anonymous";
        }

        // Internal helper classes for the YGOPro API JSON structure
        private class YGOProResult { public List<YGOProCard>? Data { get; set; } }

        private class YGOProCard
        {
            public int id { get; set; }
            public string name { get; set; } = "";
            public string type { get; set; } = "";
            public string desc { get; set; } = "";
            public string race { get; set; } = "";
            public string attribute { get; set; } = "";

            // FIX: Make this nullable int so the serializer doesn't crash on Spells/Link monsters
            public int? level { get; set; }

            // Optional: Make these nullable too if you plan to use them later
            public int? atk { get; set; }
            public int? def { get; set; }

            public List<YGOImage> card_images { get; set; } = new();
        }

        private class YGOImage { public string image_url_small { get; set; } = ""; }
    }
}