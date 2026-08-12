using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Repositories
{
    public interface IMongoDbService
    {
        Task<HydratedDeckResponse?> GetHydratedDeckAsync(string id);
        Task<IEnumerable<DeckList>> GetAsync();
        Task<DeckList> GetByIdAsync(string id);
        Task CreateAsync(DeckList deckList);
        Task UpdateByIdAsync(DeckList deck, string id);
        Task DeleteByIdAsync(string id);
        Task<List<DeckList>> GetByUserIdAsync(string userId);
        Task<bool> DeleteUserDeckAsync(string deckId, string userId);
        Task DeleteByTitleAsync(string title);
        Task SaveMetaDeckAsync(MetaDeck metaDeck);
        Task<List<MetaDeck>> GetMetaDecksAsync(string? format = null);
        Task<MetaDeck?> GetMetaDeckByIdAsync(string id);
        Task SaveMetaDecksBulkAsync(List<MetaDeck> metaDecks);
        Task<List<CardAnalytics>> GetTrendingCardsAsync(string format, int limit = 18);
        Task RecomputeCardAnalyticsAsync();
        Task<List<DeckList>> GetRecentDecksAsync(int limit = 5);
        Task<string> GetUsernameByUserIdAsync(string? userId);
        Task<MasterDuelBanListResponse?> GetLatestMasterDuelBanListAsync();
        Task SaveMasterDuelBanListAsync(MasterDuelBanListResponse banlist);
        Task<List<MasterDuelCardDocument>> GetAllMasterDuelCardsAsync();
        Task<MasterDuelCardDocument?> GetMasterDuelCardByGameIdAsync(string gameId);
        Task<bool> SaveMasterDuelDatabaseAsync(MasterDuelDatabaseSyncResponseDto syncPayload);
        Task<List<MasterDuelCardDocument>> GetRestrictedMasterDuelCardsAsync();
    }
}
