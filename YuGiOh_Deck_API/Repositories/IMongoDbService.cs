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
    }
}
