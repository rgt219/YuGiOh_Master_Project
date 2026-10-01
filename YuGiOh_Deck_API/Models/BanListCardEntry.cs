namespace YuGiOhDeckApi.Models
{
    // One restricted card. Id is the YGOPRODeck card id (null if the name couldn't be matched).
    public class BanListCardEntry
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Forbidden | Limited | Semi-Limited
    }

    public class BanListsResponse
    {
        public List<BanListCardEntry> Masterduel { get; set; } = new();
        public List<BanListCardEntry> Tcg { get; set; } = new();
        public List<BanListCardEntry> Ocg { get; set; } = new();
    }
}