using Microsoft.Extensions.Caching.Distributed;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.BackgroundServices
{
    public class NewsBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NewsBackgroundService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromHours(4);

        public NewsBackgroundService(IServiceProvider serviceProvider, ILogger<NewsBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("News Background Service initialized. Waiting 30s to stagger startup...");

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (TaskCanceledException) { return; }

            using var timer = new PeriodicTimer(_period);

            do
            {
                try
                {
                    _logger.LogInformation("Starting scheduled RSS news scrape...");

                    using var scope = _serviceProvider.CreateScope();
                    var scraperService = scope.ServiceProvider.GetRequiredService<INewsScraperService>();
                    var mongoDbService = scope.ServiceProvider.GetRequiredService<IMongoDbService>();
                    var cache = scope.ServiceProvider.GetRequiredService<IDistributedCache>();

                    var articles = await scraperService.ScrapeNewsAsync();

                    if (articles != null && articles.Count > 0)
                    {
                        await mongoDbService.SaveNewsArticlesBulkAsync(articles);
                        _logger.LogInformation("Successfully saved incoming articles to MongoDB.");

                        try
                        {
                            await cache.RemoveAsync("latest_news_20");
                        }
                        catch (Exception redisEx)
                        {
                            _logger.LogWarning("Redis cache clear skipped: {Message}", redisEx.Message);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Scheduled news scraping failed.");
                }

            } while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested);
        }
    }
}