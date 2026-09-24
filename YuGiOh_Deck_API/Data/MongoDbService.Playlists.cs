using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<DeckPlaylist> GetPlaylistByIdAsync(string id) =>
            await _deckPlaylistCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<List<DeckPlaylist>> GetPlaylistsByUserIdAsync(string userId) =>
            await _deckPlaylistCollection.Find(x => x.UserId == userId).ToListAsync();

        public async Task CreatePlaylistAsync(DeckPlaylist playlist) =>
            await _deckPlaylistCollection.InsertOneAsync(playlist);

        public async Task AddDeckToPlaylistAsync(string playlistId, string deckId)
        {
            var filter = Builders<DeckPlaylist>.Filter.Eq(p => p.Id, playlistId);
            var update = Builders<DeckPlaylist>.Update.Push(p => p.DeckIds, deckId);
            await _deckPlaylistCollection.UpdateOneAsync(filter, update);
        }

        public async Task DeletePlaylistByIdAsync(string playlistId) =>
            await _deckPlaylistCollection.DeleteOneAsync(p => p.Id == playlistId);

        public async Task DeletePlaylistByTitleAsync(string playlistTitle) =>
            await _deckPlaylistCollection.DeleteOneAsync(p => p.Title.ToLower() == playlistTitle.ToLower());
    }
}