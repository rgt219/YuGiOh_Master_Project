using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService : IMongoDbService
    {
        private readonly IMongoCollection<DeckList> _deckListCollection;
        private readonly IMongoCollection<MetaDeck> _metaDeckCollection;
        private readonly IMongoCollection<CardAnalytics> _cardAnalyticsCollection;
        private readonly IMongoCollection<BsonDocument> _usersCollection;
        private readonly IMongoCollection<MasterDuelBanListResponse> _mdBanlistCollection;
        private readonly IMongoCollection<MasterDuelCardDocument> _mdCardsCollection;
        private readonly IMongoCollection<NewsArticle> _newsCollection;
        private readonly IMongoCollection<DeckPlaylist> _deckPlaylistCollection;
        private List<CardData> _masterCache = new();

        public MongoDbService(IOptions<MongoDBSettings> mongoDBSettings)
        {
            MongoClient client = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            IMongoDatabase database = client.GetDatabase(mongoDBSettings.Value.DatabaseName);

            _deckListCollection = database.GetCollection<DeckList>(mongoDBSettings.Value.CollectionName);
            _metaDeckCollection = database.GetCollection<MetaDeck>("MetaDecks");
            _cardAnalyticsCollection = database.GetCollection<CardAnalytics>("CardAnalytics");
            _mdBanlistCollection = database.GetCollection<MasterDuelBanListResponse>("MasterDuelBanList");
            _mdCardsCollection = database.GetCollection<MasterDuelCardDocument>("MasterDuelCards");
            _newsCollection = database.GetCollection<NewsArticle>("NewsArticles");
            _deckPlaylistCollection = database.GetCollection<DeckPlaylist>("DeckPlaylists");

            IMongoDatabase usersDatabase = client.GetDatabase(mongoDBSettings.Value.UsersDatabaseName);
            _usersCollection = usersDatabase.GetCollection<BsonDocument>("Users");

            try
            {
                var indexKeys = Builders<MetaDeck>.IndexKeys.Descending(x => x.LastUpdated);
                _metaDeckCollection.Indexes.CreateOne(new CreateIndexModel<MetaDeck>(indexKeys));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[INDEX_CREATION_WARNING]: {ex.Message}");
            }

            _ = InitializeCardCache();
        }

        public async Task InitializeCardCache()
        {
            try
            {
                using var http = new HttpClient();
                http.Timeout = TimeSpan.FromMinutes(2);
                var result = await http.GetFromJsonAsync<YgoProResult>("https://db.ygoprodeck.com/api/v7/cardinfo.php");

                if (result?.Data != null)
                {
                    _masterCache = result.Data.Select(c => new CardData
                    {
                        Id = c.Id,
                        Name = c.name,
                        Type = c.type,
                        Desc = c.desc,
                        Race = c.race,
                        Attribute = c.attribute,
                        Level = c.level,
                        Atk = c.atk,
                        Def = c.def,
                        Image = c.card_images?.FirstOrDefault()?.image_url_small ?? ""
                    }).ToList();
                    Console.WriteLine($"CACHE_INITIALIZED: {_masterCache.Count} cards cached.");
                }
            }
            catch (Exception ex) { Console.WriteLine($"CACHE_ERROR: {ex.Message}"); }
        }

        public async Task<string> GetUsernameByUserIdAsync(string? userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return "Anonymous";
            try
            {
                FilterDefinition<BsonDocument> filter;
                if (int.TryParse(userId, out var intId)) filter = Builders<BsonDocument>.Filter.Eq("_id", intId);
                else if (ObjectId.TryParse(userId, out var objectId)) filter = Builders<BsonDocument>.Filter.Eq("_id", objectId);
                else filter = Builders<BsonDocument>.Filter.Eq("_id", userId);

                var userDoc = await _usersCollection.Find(filter).FirstOrDefaultAsync();
                if (userDoc != null)
                {
                    if (userDoc.Contains("userName")) return userDoc["userName"].AsString;
                    if (userDoc.Contains("username")) return userDoc["username"].AsString;
                    if (userDoc.Contains("Username")) return userDoc["Username"].AsString;
                }
            }
            catch (Exception ex) { Console.WriteLine($"[USERS_DB_LOOKUP_ERROR]: {ex.Message}"); }
            return "Anonymous";
        }

        // Internal helper classes for YGOPro API
        private sealed class YgoProResult { public List<YgoProCard>? Data { get; set; } }
        private sealed class YgoProCard
        {
            public int Id { get; set; }
            public string name { get; set; } = "";
            public string type { get; set; } = "";
            public string desc { get; set; } = "";
            public string race { get; set; } = "";
            public string attribute { get; set; } = "";
            public int? level { get; set; }
            public int? atk { get; set; }
            public int? def { get; set; }
            public List<YgoImage> card_images { get; set; } = new();
        }
        private class YgoImage { public string image_url_small { get; set; } = ""; }
    }
}