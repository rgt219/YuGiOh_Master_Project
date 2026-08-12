using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace YuGiOhDeckApi.Models
{
    public class MasterDuelCardDocument
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("konamiId")]
        public string KonamiId { get; set; } = string.Empty;

        [BsonElement("gameId")]
        public string GameId { get; set; } = string.Empty;

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("alternateArt")]
        public bool AlternateArt { get; set; }

        [BsonElement("monsterType")]
        public List<string> MonsterType { get; set; } = new();

        [BsonElement("level")]
        public int? Level { get; set; }

        [BsonElement("race")]
        public string Race { get; set; } = string.Empty;

        [BsonElement("attribute")]
        public string Attribute { get; set; } = string.Empty;

        [BsonElement("atk")]
        public int? Atk { get; set; }

        [BsonElement("def")]
        public int? Def { get; set; }

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("rarity")]
        public string Rarity { get; set; } = string.Empty;

        [BsonElement("banStatus")]
        public string BanStatus { get; set; } = string.Empty;

        [BsonElement("ocgBanStatus")]
        public string? OcgBanStatus { get; set; }

        [BsonElement("tcgBanStatus")]
        public string? TcgBanStatus { get; set; }

        [BsonElement("popRank")]
        public double PopRank { get; set; }

        [BsonElement("obtain")]
        public List<MasterDuelObtainWrapper> Obtain { get; set; } = new();

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }

    public class MasterDuelObtainWrapper
    {
        [BsonElement("amount")]
        public int Amount { get; set; }

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("source")]
        public MasterDuelSourceDetail? Source { get; set; }
    }

    public class MasterDuelSourceDetail
    {
        [BsonElement("id")]
        public string? Id { get; set; }

        [BsonElement("type")]
        public string Type { get; set; } = string.Empty;

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("expires")]
        public DateTime? Expires { get; set; }

        [BsonElement("linkedArticle")]
        public MasterDuelLinkedArticle? LinkedArticle { get; set; }
    }

    public class MasterDuelLinkedArticle
    {
        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("url")]
        public string Url { get; set; } = string.Empty;

        [BsonElement("image")]
        public string Image { get; set; } = string.Empty;
    }

    public class MasterDuelDatabaseSyncResponseDto
    {
        [BsonElement("format")]
        public string Format { get; set; } = string.Empty;

        [BsonElement("updateAt")]
        public DateTime UpdatedAt { get; set; }

        [BsonElement("count")]
        public int Count { get; set; }

        [BsonElement("cards")]
        public List<MasterDuelCardDocument> Cards { get; set; } = new();
    }
}