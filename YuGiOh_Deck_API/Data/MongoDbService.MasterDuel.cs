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

        public async Task SaveMasterDuelBanListAsync(MasterDuelBanListResponse banlist)
        {
            await _mdBanlistCollection.DeleteManyAsync(_ => true);
            await _mdBanlistCollection.InsertOneAsync(banlist);
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

            await _mdCardsCollection.Database.DropCollectionAsync("MasterDuelCards");
            foreach (var card in uniqueCards) { card.UpdatedAt = DateTime.UtcNow; card.Id = null; }

            int batchSize = 10;
            for (int i = 0; i < uniqueCards.Count; i += batchSize)
            {
                var batch = uniqueCards.Skip(i).Take(batchSize).ToList();
                if (batch.Any())
                {
                    bool batchSuccess = false;
                    int retries = 0;
                    while (!batchSuccess && retries < 10)
                    {
                        try
                        {
                            await _mdCardsCollection.InsertManyAsync(batch, new InsertManyOptions { IsOrdered = false });
                            batchSuccess = true;
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
            return true;
        }
    }
}