using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public interface IMasterDuelBanListService
    {
        Task<MasterDuelBanListResponse?> GetMasterDuelBanListAsync();
        Task<bool> TriggerScrapeAndSaveAsync();
        Task<List<MasterDuelCardDocument>> GetAllCardsAsync();
        Task<List<MasterDuelCardDocument>> GetRestrictedMasterDuelCardsAsync();
        Task<bool> BuildBanListFromDatabaseAsync();
    }
}