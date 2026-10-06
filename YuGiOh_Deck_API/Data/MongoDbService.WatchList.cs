using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<List<PriceWatch>> GetWatchesAsync(string userId) =>
            await _watchCollection.Find(w => w.UserId == userId).SortByDescending(w => w.CreatedAt).ToListAsync();

        public async Task AddWatchAsync(string userId, int productId, string cardName, string setName, string rarity)
        {
            await _watchCollection.UpdateOneAsync(
                w => w.UserId == userId && w.ProductId == productId,
                Builders<PriceWatch>.Update
                    .SetOnInsert(w => w.CardName, cardName)
                    .SetOnInsert(w => w.SetName, setName)
                    .SetOnInsert(w => w.Rarity, rarity)
                    .SetOnInsert(w => w.CreatedAt, DateTime.UtcNow),
                new UpdateOptions { IsUpsert = true }
            );
        }

        public async Task RemoveWatchAsync(string userId, int productId)
        {
            await _watchCollection.DeleteOneAsync(w => w.UserId == userId && w.ProductId == productId);
        }

        // The other direction from GetWatchesAsync: instead of "which cards does this user track?",
        // "which users track this card?". Only the user ids come back, which is all a notification needs.
        public async Task<List<string>> GetWatcherUserIdsAsync(int productId) =>
            await _watchCollection.Find(w => w.ProductId == productId)
                                  .Project(w => w.UserId)
                                  .ToListAsync();

    }
}