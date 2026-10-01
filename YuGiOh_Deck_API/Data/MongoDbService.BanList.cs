using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        private BanListsResponse? _banListsCache;
        private DateTime _banListsCachedAt = DateTime.MinValue;
        private static readonly TimeSpan BanListsCacheFor = TimeSpan.FromMinutes(10);

        // Master Duel, TCG and OCG ban lists from the MasterDuelCards collection, each card tagged with
        // its YGOPRODeck id so the website can look it up without depending on exact name spelling.
        public async Task<BanListsResponse> GetCombinedBanListsAsync()
        {
            if (_banListsCache != null && DateTime.UtcNow - _banListsCachedAt < BanListsCacheFor)
                return _banListsCache;

            if (_masterCache == null || _masterCache.Count == 0) await InitializeCardCache();

            // "Maliss <Q> White Binder" (YGOPRODeck) and "Maliss Q White Binder" (Master Duel Meta) must match.
            var idByName = new Dictionary<string, int>();
            foreach (var c in _masterCache!)
                idByName.TryAdd(NormalizeCardName(c.Name), c.Id);

            var f = Builders<MasterDuelCardDocument>.Filter;
            var restricted = await _mdCardsCollection.Find(f.Or(
                f.And(f.Ne(c => c.BanStatus, "Unlimited"), f.Ne(c => c.BanStatus, "")),
                f.Ne(c => c.TcgBanStatus, null),
                f.Ne(c => c.OcgBanStatus, null))).ToListAsync();

            var result = new BanListsResponse();
            int unmatched = 0;

            foreach (var card in restricted)
            {
                int? id = idByName.TryGetValue(NormalizeCardName(card.Name), out var found) ? found : null;

                void Add(List<BanListCardEntry> list, string? rawStatus)
                {
                    var status = NormalizeBanStatus(rawStatus);
                    if (status == null) return;
                    list.Add(new BanListCardEntry { Id = id, Name = card.Name.Trim(), Status = status });
                    if (id == null) unmatched++;
                }

                Add(result.Masterduel, card.BanStatus);
                Add(result.Tcg, card.TcgBanStatus);
                Add(result.Ocg, card.OcgBanStatus);
            }

            if (unmatched > 0) Console.WriteLine($"[BANLIST_UNMATCHED]: {unmatched} restricted entries had no YGOPRODeck match.");

            result.Masterduel = result.Masterduel.OrderBy(e => e.Name).ToList();
            result.Tcg = result.Tcg.OrderBy(e => e.Name).ToList();
            result.Ocg = result.Ocg.OrderBy(e => e.Name).ToList();

            _banListsCache = result;
            _banListsCachedAt = DateTime.UtcNow;
            return result;
        }

        // Lowercase letters and digits only: "Maliss <Q> Red Ransom" -> "malissqredransom".
        private static string NormalizeCardName(string name) =>
            new string((name ?? "").Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());

        // null means "not restricted".
        private static string? NormalizeBanStatus(string? raw)
        {
            var s = (raw ?? "").Trim().ToLowerInvariant();
            if (s.Length == 0 || s.StartsWith("unlimited")) return null;
            if (s.Contains("ban") || s.Contains("forbid") || s == "0") return "Forbidden";
            if (s.Contains("semi") || s.Contains("limited 2") || s == "2") return "Semi-Limited";
            if (s.Contains("limit") || s == "1") return "Limited";
            return null;
        }
    }
}