using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.BackgroundServices
{
    public class MetaDeckBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MetaDeckBackgroundService> _logger;

        // Run every 12 hours (adjust interval as needed)
        private readonly TimeSpan _period = TimeSpan.FromHours(12);

        public MetaDeckBackgroundService(IServiceProvider serviceProvider, ILogger<MetaDeckBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Meta Deck Background Service initialized. Waiting 45 seconds for container group stabilization...");

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(120), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                return;
            }

            using var timer = new PeriodicTimer(_period);

            // Execute immediately on startup, then periodically on timer tick
            do
            {
                try
                {
                    _logger.LogInformation("Starting scheduled multi-format meta deck scraping job...");

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var scraperService = scope.ServiceProvider.GetRequiredService<IMetaDeckScraperService>();
                        var mongoDbService = scope.ServiceProvider.GetRequiredService<IMongoDbService>();

                        // 🚀 1. Run the multi-format scraper (TCG, OCG, Master Duel, Genesys)
                        var scrapedDecks = await scraperService.ScrapeMetaDecksAsync();

                        if (scrapedDecks != null && scrapedDecks.Count > 0)
                        {
                            // ⚡ FIX: Save the scraped decks into MongoDB!
                            await mongoDbService.SaveMetaDecksBulkAsync(scrapedDecks);
                            _logger.LogInformation("Successfully saved {Count} meta decks to MongoDB.", scrapedDecks.Count);

                            await mongoDbService.RecomputeCardAnalyticsAsync();
                            _logger.LogInformation("Successfully recomputed card analytics and deck totals.");

                            try
                            {
                                var cache = scope.ServiceProvider.GetRequiredService<IDistributedCache>();
                                await cache.RemoveAsync("meta_decks_v2_all");
                                await cache.RemoveAsync("meta_decks_v2_tcg");
                                await cache.RemoveAsync("meta_decks_v2_ocg");
                                await cache.RemoveAsync("meta_decks_v2_master duel");
                                await cache.RemoveAsync("meta_decks_v2_genesys");
                            }
                            catch (Exception redisEx)
                            {
                                _logger.LogWarning("Redis cache clear skipped (Local Redis offline): {Message}", redisEx.Message);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred during the scheduled meta deck scraping execution.");
                }

            } while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested);
        }
    }
}