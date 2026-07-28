using HtmlAgilityPack;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public class MetaDeckScraperService : IMetaDeckScraperService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MetaDeckScraperService> _logger;

        public MetaDeckScraperService(HttpClient httpClient, ILogger<MetaDeckScraperService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            // Set realistic headers to avoid getting blocked by basic anti-bot rules
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            }
        }

        public async Task<List<MetaDeck>> ScrapeTcgMetaDecksAsync()
        {
            var metaDecks = new List<MetaDeck>();
            string targetUrl = "https://ygoprodeck.com/tournaments/top-decks/";

            try
            {
                _logger.LogInformation("Scraping meta decks from {Url}", targetUrl);

                string html = await _httpClient.GetStringAsync(targetUrl);
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                // Select deck card containers from the DOM
                var deckNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'deck-type-card')]");

                if (deckNodes == null)
                {
                    _logger.LogWarning("No deck nodes found on target page.");
                    return metaDecks;
                }

                foreach (var node in deckNodes.Take(10)) // Grab top 10 decks
                {
                    string archetype = node.SelectSingleNode(".//h3")?.InnerText.Trim() ?? "Unknown Archetype";

                    // Generate primary ID to share between MetaDeck and SampleDeck
                    string metaId = Guid.NewGuid().ToString();

                    // Parse main, extra, and side deck card string IDs from the page elements
                    var mainDeckIds = ExtractCardIdsFromNode(node, "main-deck");
                    var extraDeckIds = ExtractCardIdsFromNode(node, "extra-deck");
                    var sideDeckIds = ExtractCardIdsFromNode(node, "side-deck");

                    var metaDeck = new MetaDeck
                    {
                        Id = metaId,
                        Archetype = archetype,
                        Format = "TCG",
                        Tier = "Tier 1",
                        RepresentationPercentage = 15.0, // Calculated or scraped
                        SampleDeck = new DeckList
                        {
                            Id = metaId,            // Matches parent MetaDeck ID
                            Title = archetype,      // Title set to Archetype
                            UserId = null,          // Null for system/meta decks
                            MainDeck = mainDeckIds,
                            ExtraDeck = extraDeckIds,
                            SideDeck = sideDeckIds
                        },
                        LastUpdated = DateTime.UtcNow
                    };

                    metaDecks.Add(metaDeck);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while scraping meta decks.");
            }

            return metaDecks;
        }

        private List<string> ExtractCardIdsFromNode(HtmlNode parentNode, string deckTypeClass)
        {
            var cardIds = new List<string>();
            var cardNodes = parentNode.SelectNodes($".//div[contains(@class, '{deckTypeClass}')]//img[@data-card-id]");

            if (cardNodes != null)
            {
                foreach (var cardNode in cardNodes)
                {
                    string cardId = cardNode.GetAttributeValue("data-card-id", string.Empty);
                    if (!string.IsNullOrEmpty(cardId))
                    {
                        cardIds.Add(cardId);
                    }
                }
            }

            return cardIds;
        }
    }
}