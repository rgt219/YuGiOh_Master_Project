using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
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
        private List<CardData> _masterCache = new();

        public MongoDbService(IOptions<MongoDBSettings> mongoDBSettings)
        {
            
            MongoClient client = new MongoClient(mongoDBSettings.Value.ConnectionURI);
            IMongoDatabase database = client.GetDatabase(mongoDBSettings.Value.DatabaseName);
            _deckListCollection = database.GetCollection<DeckList>(mongoDBSettings.Value.CollectionName);

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

        // Keep your existing CRUD methods here...
        public async Task<DeckList> GetByIdAsync(string id) => await _deckListCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task CreateAsync(DeckList deckList) => await _deckListCollection.InsertOneAsync(deckList);
        public async Task UpdateByIdAsync(DeckList deck, string id) => await _deckListCollection.ReplaceOneAsync(x => x.Id == id, deck);
        public async Task DeleteByIdAsync(string id) => await _deckListCollection.DeleteOneAsync(x => x.Id == id);
        public async Task<List<DeckList>> GetByUserIdAsync(string userId) => await _deckListCollection.Find(x => x.UserId == userId).ToListAsync();

        // Add this to MongoDbService.cs
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