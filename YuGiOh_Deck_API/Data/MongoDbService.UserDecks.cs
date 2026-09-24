using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<DeckList> GetByIdAsync(string id) => await _deckListCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task CreateAsync(DeckList deckList) => await _deckListCollection.InsertOneAsync(deckList);
        public async Task UpdateByIdAsync(DeckList deck, string id) => await _deckListCollection.ReplaceOneAsync(x => x.Id == id, deck);
        public async Task DeleteByIdAsync(string id) => await _deckListCollection.DeleteOneAsync(x => x.Id == id);
        public async Task<List<DeckList>> GetByUserIdAsync(string userId) => await _deckListCollection.Find(x => x.UserId == userId).ToListAsync();
        public async Task<IEnumerable<DeckList>> GetAsync() => await _deckListCollection.Find(_ => true).ToListAsync();

        public async Task<bool> DeleteUserDeckAsync(string deckId, string userId)
        {
            var filter = Builders<DeckList>.Filter.And(Builders<DeckList>.Filter.Eq(x => x.Id, deckId), Builders<DeckList>.Filter.Eq(x => x.UserId, userId));
            return (await _deckListCollection.DeleteOneAsync(filter)).DeletedCount > 0;
        }

        public async Task DeleteByTitleAsync(string title) => await _deckListCollection.DeleteOneAsync(x => x.Title.ToLower() == title.ToLower());

        public async Task<List<DeckList>> GetRecentDecksAsync(int limit = 5)
        {
            var decks = await _deckListCollection.Find(_ => true).ToListAsync();
            return decks.OrderByDescending(d => d.Id).Take(limit).ToList();
        }

        public async Task<HydratedDeckResponse?> GetHydratedDeckAsync(string id)
        {
            if (_masterCache == null || _masterCache.Count == 0) await InitializeCardCache();
            var thinDeck = await GetByIdAsync(id);
            if (thinDeck == null) return null;

            return new HydratedDeckResponse
            {
                Id = thinDeck.Id!,
                Title = thinDeck.Title,
                UserId = thinDeck.UserId,
                MainDeck = thinDeck.MainDeck?.Select(idStr => _masterCache!.FirstOrDefault(c => c.Id.ToString() == idStr)).Where(c => c != null).ToList()!,
                ExtraDeck = thinDeck.ExtraDeck?.Select(idStr => _masterCache!.FirstOrDefault(c => c.Id.ToString() == idStr)).Where(c => c != null).ToList()!,
                SideDeck = thinDeck.SideDeck?.Select(idStr => _masterCache!.FirstOrDefault(c => c.Id.ToString() == idStr)).Where(c => c != null).ToList()!
            };
        }
        public async Task<List<DeckList>> GetDeckListsInPlaylistAsync(List<string> deckIds)
        {
            // Fail fast: If the playlist is empty, return an empty list to save a DB call
            if (deckIds == null || !deckIds.Any())
            {
                return new List<DeckList>();
            }

            // Find all DeckLists where the Id exists inside our deckIds list
            var filter = Builders<DeckList>.Filter.In(x => x.Id, deckIds);

            return await _deckListCollection.Find(filter).ToListAsync();
        }
    }
}