using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using YuGiOhDeckApi.Data;

namespace YuGiOhDeckApi.Services
{
    public class MetaDeckBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MetaDeckBackgroundService> _logger;

        public MetaDeckBackgroundService(IServiceProvider serviceProvider, ILogger<MetaDeckBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Initial scrape on API startup
            await RunAutoScrapeAsync();

            // Periodic timer: Re-run scrape every 12 hours
            using var timer = new PeriodicTimer(TimeSpan.FromHours(12));

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RunAutoScrapeAsync();
            }
        }

        private async Task RunAutoScrapeAsync()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var scraper = scope.ServiceProvider.GetRequiredService<IMetaDeckScraperService>();
                var mongoDbService = scope.ServiceProvider.GetRequiredService<MongoDbService>();

                _logger.LogInformation("Background Service: Auto-scraping tournament meta decks...");

                var decks = await scraper.ScrapeTcgMetaDecksAsync();
                if (decks != null && decks.Any())
                {
                    await mongoDbService.SaveMetaDecksBulkAsync(decks);
                    _logger.LogInformation("Background Service: Successfully updated {Count} meta decks in DB.", decks.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background Service: Error occurred during automated scrape.");
            }
        }
    }
}