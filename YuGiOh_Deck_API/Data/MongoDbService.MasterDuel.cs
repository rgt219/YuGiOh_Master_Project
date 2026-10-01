using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<MasterDuelBanListResponse?> GetLatestMasterDuelBanListAsync()
        {
            var allLists = await _mdBanlistCollection.Find(_ => true).ToListAsync();
            return allLists.OrderByDescending(b => b.UpdatedAt).FirstOrDefault();
        }

        // Insert the new ban list first, then remove the old ones, so readers never see an empty collection.
        public async Task SaveMasterDuelBanListAsync(MasterDuelBanListResponse banlist)
        {
            banlist.Id = null; // let Mongo generate a fresh _id
            await _mdBanlistCollection.InsertOneAsync(banlist);
            await WithRetryAsync(() => _mdBanlistCollection.DeleteManyAsync(b => b.Id != banlist.Id));
        }

        public async Task<List<MasterDuelCardDocument>> GetAllMasterDuelCardsAsync() => await _mdCardsCollection.Find(_ => true).ToListAsync();

        public async Task<MasterDuelCardDocument?> GetMasterDuelCardByGameIdAsync(string gameId) => await _mdCardsCollection.Find(c => c.GameId == gameId).FirstOrDefaultAsync();

        public async Task<List<MasterDuelCardDocument>> GetRestrictedMasterDuelCardsAsync()
        {
            return await _mdCardsCollection.Find(c => c.BanStatus != "Unlimited" && c.BanStatus != "").ToListAsync();
        }

        public async Task<bool> SaveMasterDuelDatabaseAsync(MasterDuelDatabaseSyncResponseDto syncPayload)
        {
            if (syncPayload.Cards == null || syncPayload.Cards.Count == 0) return false;
            var uniqueCards = syncPayload.Cards.Where(c => !string.IsNullOrWhiteSpace(c.Name)).GroupBy(c => c.Name.Trim()).Select(g => g.First()).ToList();

            // Every card in this sync gets the same stamp; anything older is stale and removed at the end.
            var stamp = DateTime.UtcNow;
            foreach (var card in uniqueCards) { card.UpdatedAt = stamp; card.Id = null; }

            try
            {
                int batchSize = 10; // small batches keep Cosmos DB from throttling
                for (int i = 0; i < uniqueCards.Count; i += batchSize)
                {
                    var batch = uniqueCards.Skip(i).Take(batchSize).ToList();
                    await WithRetryAsync(() => _mdCardsCollection.InsertManyAsync(batch, new InsertManyOptions { IsOrdered = false }));
                }
            }
            catch
            {
                // Failed halfway: discard the partial new data and keep the old collection intact.
                await _mdCardsCollection.DeleteManyAsync(c => c.UpdatedAt == stamp);
                throw;
            }

            await WithRetryAsync(() => _mdCardsCollection.DeleteManyAsync(c => c.UpdatedAt < stamp));
            return true;
        }

        private static async Task WithRetryAsync(Func<Task> action, int maxAttempts = 10)
        {
            for (int attempt = 1; ; attempt++)
            {
                try { await action(); return; }
                catch when (attempt < maxAttempts) { await Task.Delay(500 * attempt); }
            }
        }
    }
}