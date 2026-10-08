using MongoDB.Driver;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<DeckNote?> GetDeckNoteAsync(string userId, string deckId)
        {
            return await _deckNoteCollection.Find(w => w.UserId == userId && w.DeckId == deckId).FirstOrDefaultAsync();
        }

        public async Task<List<DeckNote>> GetDeckNotesAsync(string userId)
        {
            return await _deckNoteCollection.Find(w => w.UserId == userId).ToListAsync();

        }

        public async Task<DeckNote> SaveDeckNoteAsync(string userId, string deckId, string notes, List<string> tags)
        {
            var key = DeckNote.BuildKey(userId, deckId);

            return await _deckNoteCollection.FindOneAndUpdateAsync(
                w => w.Key == key,
                Builders<DeckNote>.Update
                    .Set(w => w.Notes, notes)
                    .Set(w => w.Tags, tags)
                    .Set(w => w.UpdatedAt, DateTime.UtcNow)
                    .SetOnInsert(w => w.UserId, userId)
                    .SetOnInsert(w => w.DeckId, deckId),
                new FindOneAndUpdateOptions<DeckNote> { IsUpsert = true, ReturnDocument = ReturnDocument.After });
        }

        public async Task<bool> DeleteDeckNoteAsync(string userId, string deckId)
        {
            var result = await _deckNoteCollection.DeleteOneAsync(w => w.Key == DeckNote.BuildKey(userId, deckId));
            return result.DeletedCount > 0;
        }

        public async Task DeleteDeckNotesByDeckAsync(string deckId)
        {
            await _deckNoteCollection.DeleteManyAsync(w => w.DeckId == deckId);
        }
    }
}