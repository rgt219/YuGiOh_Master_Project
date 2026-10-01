using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.BackgroundServices
{
    // Refreshes the Master Duel card database and ban list from the Go worker once a day.
    public class MasterDuelBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MasterDuelBackgroundService> _logger;

        private static readonly TimeSpan Period = TimeSpan.FromHours(24);
        private static readonly TimeSpan FreshFor = TimeSpan.FromHours(20); // skip if data is newer than this
        private const int MaxAttempts = 3;

        public MasterDuelBackgroundService(IServiceProvider serviceProvider, ILogger<MasterDuelBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try { await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken); } // let the Go worker come up
            catch (OperationCanceledException) { return; }

            using var timer = new PeriodicTimer(Period);
            do
            {
                await RunOnceAsync(stoppingToken);
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }

        private async Task RunOnceAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IMasterDuelBanListService>();

                // Restarts and extra replicas shouldn't re-scrape data that was just refreshed.
                // But data saved by an older version of the sync is always re-scraped, however new it is.
                var latest = await service.GetMasterDuelBanListAsync();
                if (latest != null
                    && latest.SyncVersion == MasterDuelBanListResponse.CurrentSyncVersion
                    && DateTime.UtcNow - latest.UpdatedAt < FreshFor)
                {
                    _logger.LogInformation("Master Duel data is fresh (updated {UpdatedAt:u}); skipping sync.", latest.UpdatedAt);
                    return;
                }

                _logger.LogInformation("Master Duel sync starting (stored data: {Info}).",
                    latest == null ? "none" : $"updated {latest.UpdatedAt:u}, version {latest.SyncVersion}");

                for (int attempt = 1; attempt <= MaxAttempts && !ct.IsCancellationRequested; attempt++)
                {
                    if (await service.TriggerScrapeAndSaveAsync())
                    {
                        _logger.LogInformation("Master Duel sync completed.");
                        return;
                    }

                    _logger.LogWarning("Master Duel sync failed (attempt {Attempt}/{Max}).", attempt, MaxAttempts);
                    if (attempt < MaxAttempts) await Task.Delay(TimeSpan.FromMinutes(5), ct);
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Master Duel sync.");
            }
        }
    }
}