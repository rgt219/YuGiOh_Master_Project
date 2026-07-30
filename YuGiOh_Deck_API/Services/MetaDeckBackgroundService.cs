using System;
using System.Threading;
using System.Threading.Tasks;
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
            _logger.LogInformation("Meta Deck Background Service initialized.");

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
                            _logger.LogInformation("Scraped {Count} meta decks. Updating MongoDB collection...", scrapedDecks.Count);

                            // 🚀 2. Clear out older documents to prevent duplicates across runs
                            await mongoDbService.SaveMetaDecksBulkAsync(scrapedDecks);

                            _logger.LogInformation("Successfully updated MongoDB with fresh multi-format meta decks.");
                        }
                        else
                        {
                            _logger.LogWarning("Scraper returned 0 decks. Skipping database update.");
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