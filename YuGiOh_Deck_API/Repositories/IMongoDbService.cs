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
        Task SaveMetaDecksBulkAsync(List<MetaDeck> metaDecks);
        Task<List<CardAnalytics>> GetTrendingCardsAsync(string format, int limit = 18);
        Task RecomputeCardAnalyticsAsync();
        Task<List<DeckList>> GetRecentDecksAsync(int limit = 5);
    }
}
