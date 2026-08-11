using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace YuGiOhDeckApi.Models
{
    public class MasterDuelBanListResponse
    {
        public string Format { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
        public int Count { get; set; }
        public List<MasterDuelBanListEntry> Cards { get; set; } = new();
    }

    public class MasterDuelBanListEntry
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

}
