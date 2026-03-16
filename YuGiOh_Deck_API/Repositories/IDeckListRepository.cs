using MongoDB.Bson;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Repositories
{
    public interface IDeckListRepository
    {
        Task<IEnumerable<DeckList>> GetAllAsync();
        Task<DeckList?> GetByIdAsync(int id);
        Task AddDeckListAsync(DeckList deckList);
        Task UpdateDeckListAsync(DeckList deckList);
        Task DeleteDeckListAsync(int id);
    }
}
