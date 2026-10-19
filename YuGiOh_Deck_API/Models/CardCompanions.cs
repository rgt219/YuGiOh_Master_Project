using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    // One document per card, written nightly by the Python companion job. The Deck API only reads it.
    [BsonIgnoreExtraElements]
    public class CardCompanions
    {
        [BsonId]                                                   
        public string CardId { get; set; } = string.Empty;

        [BsonElement("deckCount")]                             
        public int DeckCount { get; set; }

        [BsonElement("companions")]
        public List<CompanionEntry> Companions { get; set; } = new();      

        [BsonElement("sideCompanions")]
        public List<CompanionEntry> SideCompanions { get; set; } = new();

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class CompanionEntry
    {
        [BsonElement("cardId")]
        public string CardId { get; set; } = string.Empty;

        [BsonElement("together")]
        public int Together { get; set; }                    

        [BsonElement("percent")]                                
        public double Percent { get; set; }

        [BsonElement("lift")]
        public double Lift { get; set; }                   
    }
}