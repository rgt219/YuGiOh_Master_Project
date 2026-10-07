using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        // Sorted in memory on purpose. Cosmos DB's Mongo API refuses to sort on a field that has no index
        // ("The index path corresponding to the specified order-by item is excluded"), and a user can track at most
        // 100 cards, so sorting this small list here is cheap and needs no extra index.
        public async Task<List<PriceWatch>> GetWatchesAsync(string userId)
        {
            var watches = await _watchCollection.Find(w => w.UserId == userId).ToListAsync();
            return watches.OrderByDescending(w => w.CreatedAt).ToList();
        }

        // Who is tracking this product? Used by the price-drop consumer to decide who gets a notification.
        public async Task<List<string>> GetWatcherUserIdsAsync(int productId) =>
            await _watchCollection.Find(w => w.ProductId == productId)
                                  .Project(w => w.UserId)
                                  .ToListAsync();

        // "Track" is safe to repeat: tracking a card you already track changes nothing (SetOnInsert only
        // applies when the row is created), so a double click or a retry can't make a duplicate.
        public async Task AddWatchAsync(string userId, int productId, string cardName, string setName, string rarity)
        {
            var key = PriceWatch.BuildKey(userId, productId);

            await _watchCollection.UpdateOneAsync(
                w => w.Key == key,
                Builders<PriceWatch>.Update
                    .SetOnInsert(w => w.UserId, userId)
                    .SetOnInsert(w => w.ProductId, productId)
                    .SetOnInsert(w => w.CardName, cardName)
                    .SetOnInsert(w => w.SetName, setName)
                    .SetOnInsert(w => w.Rarity, rarity)
                    .SetOnInsert(w => w.CreatedAt, DateTime.UtcNow),
                new UpdateOptions { IsUpsert = true });
        }

        // Also safe to repeat: stopping tracking a card you don't track is a no-op.
        public async Task RemoveWatchAsync(string userId, int productId) =>
            await _watchCollection.DeleteOneAsync(w => w.UserId == userId && w.ProductId == productId);
    }
}