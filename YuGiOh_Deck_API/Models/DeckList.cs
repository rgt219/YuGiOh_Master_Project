

using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace YuGiOhDeckApi.Models
{
    public class DeckList
    {
        // CHANGE: Change Card objects to strings (IDs)
        [BsonElement("mainDeck")]
        public List<string>? MainDeck { get; set; }

        [BsonElement("extraDeck")]
        public List<string>? ExtraDeck { get; set; }

        [BsonElement("sideDeck")]
        public List<string>? SideDeck { get; set; }

        public DeckList()
        {
            MainDeck = new List<string>();
            ExtraDeck = new List<string>();
            SideDeck = new List<string>();
        }

        [BsonId]
        [BsonRepresentation(BsonType.String)] // CHANGE: Use string IDs for random flexibility
        public string? Id { get; set; }

        [BsonElement("title")]
        public string Title { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } // Matches the string format from React
    }
}


