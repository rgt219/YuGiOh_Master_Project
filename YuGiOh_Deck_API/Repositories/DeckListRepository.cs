using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Repositories
{
    public class DeckListRepository : IDeckListRepository
    {
        public readonly AppDbContext _context;

        public DeckListRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task AddDeckListAsync(DeckList deckList)
        {
            await _context.DeckList.AddAsync(deckList);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteDeckListAsync(int id)
        {
            var deckListinDb = await _context.DeckList.FindAsync(id);

            if(deckListinDb == null)
            {
                throw new KeyNotFoundException($"DeckList with id {id} not found.");
            }

            _context.DeckList.Remove(deckListinDb);

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<DeckList>> GetAllAsync()
        {
            return await _context.DeckList.ToListAsync();
        }

        public async Task<DeckList?> GetByIdAsync(int id)
        {
            return await _context.DeckList.FindAsync(id);
        }

        public async Task UpdateDeckListAsync(DeckList deckList)
        {
            _context.DeckList.Update(deckList);
            await _context.SaveChangesAsync();
        }
    }
}
