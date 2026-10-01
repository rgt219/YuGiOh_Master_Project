using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<List<CollectionEntry>> GetCollectionAsync(string userId) =>
            await _collectionCollection.Find(e => e.UserId == userId).ToListAsync();

        // Sets (not adds to) the number of copies. 0 removes the card from the collection.
        // "Set" is safe to repeat: sending the same request twice gives the same result.
        public async Task SetCollectionQuantityAsync(string userId, int cardId, int quantity)
        {
            if (quantity <= 0)
            {
                await _collectionCollection.DeleteOneAsync(e => e.UserId == userId && e.CardId == cardId);
                return;
            }

            // Upsert: update the row if it exists, otherwise create it. The filter's fields
            // (userId, cardId) are copied into the new row automatically.
            await _collectionCollection.UpdateOneAsync(
                e => e.UserId == userId && e.CardId == cardId,
                Builders<CollectionEntry>.Update
                    .Set(e => e.Quantity, quantity)
                    .Set(e => e.UpdatedAt, DateTime.UtcNow),
                new UpdateOptions { IsUpsert = true });
        }
    }
}