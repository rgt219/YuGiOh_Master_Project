using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MarketTelemetry.Service.Data;
using MarketTelemetry.Service.Events;
using MarketTelemetry.Service.Models;
using System.Net.Http.Json;
using System.Net.Http;

namespace MarketTelemetry.Service.Workers
{
    public class TcgCsvIngestionWorker : BackgroundService
    {
        private readonly ILogger<TcgCsvIngestionWorker> _logger;
        private readonly MarketDbService _dbService;
        private readonly IPriceDropPublisher _priceDropPublisher;
        private readonly HttpClient _httpClient;
        private const int YugiohCategoryId = 2;

        public TcgCsvIngestionWorker(ILogger<TcgCsvIngestionWorker> logger, MarketDbService dbService, IPriceDropPublisher priceDropPublisher, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _dbService = dbService;
            _priceDropPublisher = priceDropPublisher;
            _httpClient = httpClientFactory.CreateClient();
            // This User-Agent now satisfies both TCGCSV and the Yugipedia MediaWiki API!
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "ErregeteygoMarketWorker/1.0");
        }

        // 🚀 NEW: Helper to fetch the transparent pack art
        private async Task<string?> GetWikiImageUrlAsync(string setName)
        {
            try
            {
                // Format name for wiki URL (e.g., "Blazing Dominion" -> "Blazing_Dominion")
                string formattedName = Uri.EscapeDataString(setName.Replace(" ", "_"));
                string url = $"https://yugipedia.com/api.php?action=query&prop=pageimages&titles={formattedName}&format=json&pithumbsize=500";

                var response = await _httpClient.GetFromJsonAsync<YugipediaResponse>(url);

                if (response?.Query?.Pages != null && response.Query.Pages.Count > 0)
                {
                    // Extract the first page result dynamically
                    var page = response.Query.Pages.Values.FirstOrDefault();
                    if (page?.Thumbnail != null && !string.IsNullOrEmpty(page.Thumbnail.Source))
                    {
                        return page.Thumbnail.Source;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to fetch wiki image for {Set}: {Message}", setName, ex.Message);
            }
            return null;
        }

        // Looks for drops on the cards people are tracking and publishes one event per drop.
        // It runs BEFORE today's prices are saved, so "yesterday's price" is still the newest thing in the database.
        // It also never throws: price history is the core product, and an alerting problem must not stop it being saved.
        private async Task PublishPriceDropsAsync(List<MarketSnapshot> snapshots, DateTime todayUtc, CancellationToken cancellationToken)
        {
            try
            {
                var watched = await _dbService.GetWatchedProductIdsAsync(snapshots.Select(s => s.ProductId));
                if (watched.Count == 0) return;

                var previous = await _dbService.GetPreviousSnapshotsAsync(watched, todayUtc);

                foreach (var snapshot in snapshots.Where(s => watched.Contains(s.ProductId)))
                {
                    previous.TryGetValue(snapshot.ProductId, out var before);
                    var drop = PriceDropDetector.Detect(before, snapshot, todayUtc);
                    if (drop == null) continue;

                    try
                    {
                        await _priceDropPublisher.PublishAsync(drop, cancellationToken);
                        _logger.LogInformation("Price drop published: {Card} ({Set}) {Old} -> {New}", drop.CardName, drop.SetName, drop.OldPrice, drop.NewPrice);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        _logger.LogWarning("Could not publish price drop for product {ProductId}: {Message}", drop.ProductId, ex.Message);
                    }
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning("Price drop check failed; prices will still be saved: {Message}", ex.Message);
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(TimeSpan.FromHours(24));

            do
            {
                _logger.LogInformation("Starting daily TCGCSV market ingestion...");

                try
                {
                    var groups = await _httpClient.GetFromJsonAsync<TcgCsvGroupResponse>(
                        $"https://tcgcsv.com/tcgplayer/{YugiohCategoryId}/groups", stoppingToken);

                    if (groups?.Results != null)
                    {
                        foreach (var group in groups.Results)
                        {
                            if (stoppingToken.IsCancellationRequested) break;

                            try
                            {
                                bool alreadyIngested = await _dbService.IsSetIngestedTodayAsync(group.Name);
                                if (alreadyIngested)
                                {
                                    _logger.LogInformation("Set '{SetName}' already ingested for today. Skipping.", group.Name);
                                    continue;
                                }

                                var products = await _httpClient.GetFromJsonAsync<TcgCsvProductResponse>(
                                    $"https://tcgcsv.com/tcgplayer/{YugiohCategoryId}/{group.GroupId}/products", stoppingToken);

                                var prices = await _httpClient.GetFromJsonAsync<TcgCsvPriceResponse>(
                                    $"https://tcgcsv.com/tcgplayer/{YugiohCategoryId}/{group.GroupId}/prices", stoppingToken);

                                if (products?.Results == null || prices?.Results == null) continue;

                                // 🚀 NEW: Attempt to get the crisp Wiki image first
                                string setImageUrl = await GetWikiImageUrlAsync(group.Name) ?? string.Empty;

                                // 🚀 FALLBACK: If Wiki fails, use the TCGPlayer box thumbnail
                                if (string.IsNullOrEmpty(setImageUrl))
                                {
                                    var sealedProduct = products.Results.FirstOrDefault(p =>
                                        (p.Name.Contains("Booster Box", StringComparison.OrdinalIgnoreCase) ||
                                         p.Name.Contains("Booster Pack", StringComparison.OrdinalIgnoreCase)) &&
                                        (p.ExtendedData == null || !p.ExtendedData.Any(e => e.Name == "Rarity")));

                                    setImageUrl = sealedProduct != null
                                        ? $"https://tcgplayer-cdn.tcgplayer.com/product/{sealedProduct.ProductId}_200w.jpg"
                                        : "/images/default-set.png";
                                }

                                var setCatalog = new SetCatalog
                                {
                                    GroupId = group.GroupId,
                                    SetName = group.Name,
                                    Abbreviation = group.Abbreviation,
                                    ImageUrl = setImageUrl
                                };
                                await _dbService.SaveSetCatalogAsync(setCatalog);

                                var todayUtc = DateTime.UtcNow.Date;
                                var snapshots = new List<MarketSnapshot>();

                                foreach (var product in products.Results)
                                {
                                    var priceData = prices.Results.FirstOrDefault(p => p.ProductId == product.ProductId);
                                    if (priceData == null) continue;

                                    snapshots.Add(new MarketSnapshot
                                    {
                                        ProductId = product.ProductId,
                                        CardName = product.Name,
                                        SetName = group.Name,
                                        Rarity = product.ExtendedData?.FirstOrDefault(e => e.Name == "Rarity")?.Value ?? "Common",
                                        LowPrice = priceData.LowPrice,
                                        MarketPrice = priceData.MarketPrice,
                                        ListedMedian = priceData.MidPrice,
                                        HighPrice = priceData.HighPrice,
                                        Timestamp = todayUtc
                                    });
                                }

                                if (snapshots.Any())
                                {
                                    // Alerts first, then save. If the app dies in between, the set is not marked as ingested,
                                    // so the retry finds the same drops and publishes the same EventIds (which the Deck API ignores).
                                    await PublishPriceDropsAsync(snapshots, todayUtc, stoppingToken);

                                    await _dbService.SaveSnapshotsBulkAsync(snapshots);
                                    _logger.LogInformation("Ingested {Count} prices for set: {Set}", snapshots.Count, group.Name);
                                }

                                await Task.Delay(1000, stoppingToken);
                            }
                            catch (Exception setEx)
                            {
                                _logger.LogWarning("Failed to process set {SetId} ({SetName}): {Message}", group.GroupId, group.Name, setEx.Message);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to run daily market telemetry pipeline.");
                }

            } while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested);
        }
    }
}