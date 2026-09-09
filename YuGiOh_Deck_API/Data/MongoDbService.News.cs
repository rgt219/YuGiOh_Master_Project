using MongoDB.Driver;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Data
{
    public partial class MongoDbService
    {
        public async Task<List<NewsArticle>> GetLatestNewsAsync(int limit = 20)
        {
            // 1. Fetch all articles without sorting to bypass Cosmos DB index rules
            var allArticles = await _newsCollection
                .Find(_ => true)
                .ToListAsync();

            // 2. Sort them in C# memory, then take the limit
            return allArticles
                .OrderByDescending(a => a.PublishedDate)
                .Take(limit)
                .ToList();
        }

        public async Task SaveNewsArticlesBulkAsync(List<NewsArticle> articles)
        {
            if (articles == null || !articles.Any()) return;

            // 1. Extract the unique URLs (our IDs)
            var incomingIds = articles
                .Where(a => !string.IsNullOrWhiteSpace(a.Id))
                .Select(a => a.Id)
                .Distinct()
                .ToList();

            if (!incomingIds.Any()) return;

            // 2. Query MongoDB for articles we already downloaded
            var existingFilter = Builders<NewsArticle>.Filter.In(a => a.Id, incomingIds);
            var existingArticleIds = await _newsCollection
                .Find(existingFilter)
                .Project(a => a.Id)
                .ToListAsync();

            var existingIdSet = new HashSet<string>(existingArticleIds);

            // 3. Keep ONLY brand-new articles
            var brandNewArticles = articles
                .Where(a => !existingIdSet.Contains(a.Id))
                .GroupBy(a => a.Id)
                .Select(g => g.First())
                .ToList();

            if (!brandNewArticles.Any())
            {
                Console.WriteLine($"[NEWS_SYNC]: No new articles found. Skipped {articles.Count}.");
                return;
            }

            Console.WriteLine($"[NEWS_SYNC]: Found {brandNewArticles.Count} new articles! Inserting now...");

            // 4. Batch insert
            int batchSize = 25;
            for (int i = 0; i < brandNewArticles.Count; i += batchSize)
            {
                var batch = brandNewArticles.Skip(i).Take(batchSize).ToList();
                if (batch.Any())
                {
                    try
                    {
                        await _newsCollection.InsertManyAsync(batch, new InsertManyOptions { IsOrdered = false });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[NEWS_SYNC_ERROR]: Failed to insert batch. {ex.Message}");
                    }
                }
            }
        }
    }
}