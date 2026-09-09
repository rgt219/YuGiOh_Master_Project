using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<MetaDeck?> GetMetaDeckByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            var filter = Builders<MetaDeck>.Filter.Or(
                Builders<MetaDeck>.Filter.Eq(d => d.Id, id),
                Builders<MetaDeck>.Filter.Eq("_id", id)
            );
            return await _metaDeckCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<List<MetaDeck>> GetMetaDecksAsync(string? format = null)
        {
            var sort = Builders<MetaDeck>.Sort.Descending(d => d.LastUpdated);
            if (string.IsNullOrWhiteSpace(format)) return await _metaDeckCollection.Find(_ => true).Sort(sort).ToListAsync();

            string safeFormat = Regex.Escape(format.Trim());
            var filter = Builders<MetaDeck>.Filter.Regex(d => d.Format, new BsonRegularExpression($"^{safeFormat}$", "i"));
            return await _metaDeckCollection.Find(filter).Sort(sort).ToListAsync();
        }

        public async Task SaveMetaDeckAsync(MetaDeck metaDeck)
        {
            var filter = Builders<MetaDeck>.Filter.Eq(x => x.Id, metaDeck.Id);
            await _metaDeckCollection.ReplaceOneAsync(filter, metaDeck, new ReplaceOptions { IsUpsert = true });
        }

        // 🚀 THE FIX: APPEND ONLY, SKIP IF EXISTS
        public async Task SaveMetaDecksBulkAsync(List<MetaDeck> metaDecks)
        {
            if (metaDecks == null || !metaDecks.Any()) return;

            // Gather distinct IDs from the incoming scrape
            var incomingIds = metaDecks.Where(d => !string.IsNullOrWhiteSpace(d.Id)).Select(d => d.Id).Distinct().ToList();
            if (!incomingIds.Any()) return;

            // Query MongoDB for IDs that ALREADY exist
            var existingFilter = Builders<MetaDeck>.Filter.In(d => d.Id, incomingIds);
            var existingDeckIds = await _metaDeckCollection.Find(existingFilter).Project(d => d.Id).ToListAsync();
            var existingIdSet = new HashSet<string>(existingDeckIds);

            // Keep ONLY brand-new decks that are not in MongoDB
            var brandNewDecks = metaDecks
                .Where(d => !existingIdSet.Contains(d.Id))
                .GroupBy(d => d.Id)
                .Select(g => g.First())
                .ToList();

            if (!brandNewDecks.Any())
            {
                Console.WriteLine($"[META_DECKS_SYNC]: All {metaDecks.Count} scraped decks already exist. 0 inserted.");
                return;
            }

            Console.WriteLine($"[META_DECKS_SYNC]: Inserting {brandNewDecks.Count} new decks. Skipped {existingIdSet.Count}.");

            int batchSize = 50;
            for (int i = 0; i < brandNewDecks.Count; i += batchSize)
            {
                var batch = brandNewDecks.Skip(i).Take(batchSize).ToList();
                if (batch.Any())
                {
                    bool batchSuccess = false;
                    int retries = 0;
                    while (!batchSuccess && retries < 10)
                    {
                        try
                        {
                            await _metaDeckCollection.InsertManyAsync(batch, new InsertManyOptions { IsOrdered = false });
                            batchSuccess = true;
                        }
                        catch (Exception)
                        {
                            retries++;
                            if (retries >= 10) throw;
                            await Task.Delay(500 * retries);
                        }
                    }
                }
            }
        }

        public async Task RecomputeCardAnalyticsAsync()
        {
            var allDecks = await _metaDeckCollection.Find(_ => true).ToListAsync();
            if (!allDecks.Any()) return;

            var groupedDecks = allDecks.Where(d => !string.IsNullOrWhiteSpace(d.Format)).GroupBy(d => d.Format.Trim().ToUpper());
            var aggregatedAnalytics = new List<CardAnalytics>();

            foreach (var group in groupedDecks)
            {
                string formatKey = group.Key;
                var formatDecks = group.ToList();
                int totalDecks = formatDecks.Count;
                var cardStats = new Dictionary<string, (int DeckCount, int TotalCopies)>();

                foreach (var deck in formatDecks)
                {
                    if (deck.SampleDeck == null) continue;
                    var main = deck.SampleDeck.MainDeck ?? new List<string>();
                    var extra = deck.SampleDeck.ExtraDeck ?? new List<string>();
                    var side = deck.SampleDeck.SideDeck ?? new List<string>();

                    var allCards = main.Concat(extra).Concat(side).ToList();
                    var uniqueCardsInDeck = new HashSet<string>(allCards);

                    foreach (var cardId in uniqueCardsInDeck)
                    {
                        if (string.IsNullOrWhiteSpace(cardId)) continue;
                        if (!cardStats.ContainsKey(cardId)) cardStats[cardId] = (0, 0);
                        cardStats[cardId] = (cardStats[cardId].DeckCount + 1, cardStats[cardId].TotalCopies);
                    }
                    foreach (var cardId in allCards)
                    {
                        if (string.IsNullOrWhiteSpace(cardId) || !cardStats.ContainsKey(cardId)) continue;
                        cardStats[cardId] = (cardStats[cardId].DeckCount, cardStats[cardId].TotalCopies + 1);
                    }
                }

                foreach (var (cardId, stats) in cardStats)
                {
                    aggregatedAnalytics.Add(new CardAnalytics
                    {
                        CardId = cardId,
                        Format = formatKey,
                        DeckCount = stats.DeckCount,
                        TotalDecksInFormat = totalDecks,
                        InclusionRate = Math.Round(((double)stats.DeckCount / totalDecks) * 100, 1),
                        TotalCopies = stats.TotalCopies,
                        AvgCopies = Math.Round((double)stats.TotalCopies / stats.DeckCount, 1),
                        LastUpdated = DateTime.UtcNow
                    });
                }
            }
            await _cardAnalyticsCollection.DeleteManyAsync(_ => true);
            if (aggregatedAnalytics.Any()) await _cardAnalyticsCollection.InsertManyAsync(aggregatedAnalytics);
        }

        public async Task<List<CardAnalytics>> GetTrendingCardsAsync(string format, int limit = 18)
        {
            string safeFormat = Regex.Escape(format.Trim());
            var filter = Builders<CardAnalytics>.Filter.Regex(c => c.Format, new BsonRegularExpression($"^{safeFormat}$", "i"));
            var formatCards = await _cardAnalyticsCollection.Find(filter).ToListAsync();
            return formatCards.OrderByDescending(c => c.DeckCount).ThenByDescending(c => c.TotalCopies).Take(limit).ToList();
        }
    }
}