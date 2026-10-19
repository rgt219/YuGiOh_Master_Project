using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<CardCompanions?> GetCardCompanionsAsync(string cardId)
        {
            return await _cardCompanionsCollection.Find(c => c.CardId == cardId).FirstOrDefaultAsync();
        }
    }
}