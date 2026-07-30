using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public class MetaDeckScraperService : IMetaDeckScraperService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MetaDeckScraperService> _logger;

        // Map format keys to their respective YGOProDeck category routes
        private readonly Dictionary<string, string> _formatUrls = new(StringComparer.OrdinalIgnoreCase)
        {
            ["TCG"] = "https://ygoprodeck.com/category/format/tournament%20meta%20decks",
            ["OCG"] = "https://ygoprodeck.com/category/format/tournament%20meta%20decks%20ocg%20%28asian-english%29",
            ["MASTER DUEL"] = "https://ygoprodeck.com/category/format/master%20duel%20decks",
            ["GENESYS"] = "https://ygoprodeck.com/category/format/tournament%20meta%20decks%20%28genesys%29"
        };

        public MetaDeckScraperService(HttpClient httpClient, ILogger<MetaDeckScraperService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            }
            if (!_httpClient.DefaultRequestHeaders.Contains("Accept"))
            {
                _httpClient.DefaultRequestHeaders.Add("Accept",
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
            }
            if (!_httpClient.DefaultRequestHeaders.Contains("Accept-Language"))
            {
                _httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
            }
        }

        public async Task<List<MetaDeck>> ScrapeMetaDecksAsync()
        {
            var metaDecks = new List<MetaDeck>();

            foreach (var (formatKey, categoryUrl) in _formatUrls)
            {
                try
                {
                    _logger.LogInformation("Pass 1: Scraping category grid for format '{Format}' from {Url}", formatKey, categoryUrl);
                    string html = await _httpClient.GetStringAsync(categoryUrl);

                    if (string.IsNullOrWhiteSpace(html)) continue;

                    var tempDoc = new HtmlDocument();
                    tempDoc.LoadHtml(html);

                    var deckLinkNodes = tempDoc.DocumentNode.SelectNodes("//a[contains(@href, '/deck/')]");
                    if (deckLinkNodes == null || !deckLinkNodes.Any())
                    {
                        _logger.LogWarning("No deck links found for format '{Format}' on page: {Url}", formatKey, categoryUrl);
                        continue;
                    }

                    var distinctLinks = deckLinkNodes
                        .Select(n => new
                        {
                            Href = n.GetAttributeValue("href", string.Empty),
                            Text = n.InnerText.Trim()
                        })
                        .Where(x => !string.IsNullOrEmpty(x.Href) && x.Href.Contains("/deck/"))
                        .GroupBy(x => x.Href)
                        .Select(g => g.First())
                        .ToList();

                    _logger.LogInformation("Found {Count} distinct deck links for format '{Format}'. Starting Pass 2...", distinctLinks.Count, formatKey);

                    foreach (var link in distinctLinks)
                    {
                        string fullDeckUrl = link.Href.StartsWith("http") ? link.Href : $"https://ygoprodeck.com{link.Href}";

                        var (mainDeck, extraDeck, sideDeck, pilot, placement) = await ScrapeDeckDetailsAsync(fullDeckUrl);

                        string metaId = Guid.NewGuid().ToString();
                        string archetype = string.IsNullOrWhiteSpace(link.Text) ? $"{formatKey} Meta Deck" : link.Text;

                        metaDecks.Add(new MetaDeck
                        {
                            Id = metaId,
                            Archetype = archetype,
                            Format = formatKey, // Assigns current format (TCG, OCG, MASTER DUEL, GENESYS)
                            Tier = "Tier 1",
                            RepresentationPercentage = 15.0,
                            SampleDeck = new DeckList
                            {
                                Id = metaId,
                                Title = archetype,
                                UserId = null,
                                MainDeck = mainDeck,
                                ExtraDeck = extraDeck,
                                SideDeck = sideDeck
                            },
                            LastUpdated = DateTime.UtcNow,
                            Pilot = pilot,
                            Placement = placement
                        });

                        _logger.LogInformation("Parsed '{Archetype}' ({Format}) -> Pilot: {Pilot}, Placement: {Placement}",
                            archetype, formatKey, pilot, placement);

                        await Task.Delay(500);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error scraping format '{Format}' from {Url}", formatKey, categoryUrl);
                }
            }

            return metaDecks;
        }

        private async Task<(List<string> Main, List<string> Extra, List<string> Side, string Pilot, string Placement)> ScrapeDeckDetailsAsync(string deckUrl)
        {
            var mainDeck = new List<string>();
            var extraDeck = new List<string>();
            var sideDeck = new List<string>();
            string pilot = "Unknown Pilot";
            string placement = "Tournament Meta Deck";

            try
            {
                await Task.Delay(300);
                string html = await _httpClient.GetStringAsync(deckUrl);
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                pilot = ExtractPilotFromDoc(doc);
                placement = ExtractPlacementFromDoc(doc);

                // YDK Direct Download
                var deckIdMatch = Regex.Match(deckUrl, @"-(\d+)$");
                if (deckIdMatch.Success)
                {
                    string deckId = deckIdMatch.Groups[1].Value;
                    string ydkUrl = $"https://ygoprodeck.com/api/deck/downloadYDK.php?file={deckId}";

                    try
                    {
                        await Task.Delay(300);
                        string ydkContent = await _httpClient.GetStringAsync(ydkUrl);

                        if (!string.IsNullOrWhiteSpace(ydkContent) && ydkContent.Contains("#main"))
                        {
                            var ydkResult = ParseYdkContent(ydkContent);
                            if (ydkResult.Main.Any())
                            {
                                return (ydkResult.Main, ydkResult.Extra, ydkResult.Side, pilot, placement);
                            }
                        }
                    }
                    catch
                    {
                        // Fallback to DOM card extraction below
                    }
                }

                // Fallback DOM Card Extraction
                var mainNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'main-deck') or contains(@id, 'main-deck') or contains(@id, 'deck-main')]")
                               ?? doc.DocumentNode.SelectSingleNode("//*[contains(text(), 'Main Deck')]/following-sibling::div[1]");

                var extraNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'extra-deck') or contains(@id, 'extra-deck') or contains(@id, 'deck-extra')]")
                                ?? doc.DocumentNode.SelectSingleNode("//*[contains(text(), 'Extra Deck')]/following-sibling::div[1]");

                var sideNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'side-deck') or contains(@id, 'side-deck') or contains(@id, 'deck-side')]")
                               ?? doc.DocumentNode.SelectSingleNode("//*[contains(text(), 'Side Deck')]/following-sibling::div[1]");

                mainDeck = ExtractCardIdsFromNode(mainNode);
                extraDeck = ExtractCardIdsFromNode(extraNode);
                sideDeck = ExtractCardIdsFromNode(sideNode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to scrape deck details from: {Url}", deckUrl);
            }

            return (mainDeck, extraDeck, sideDeck, pilot, placement);
        }

        private string ExtractPilotFromDoc(HtmlDocument doc)
        {
            var node = doc.DocumentNode.SelectSingleNode("//a[contains(@href, 'by-player')]")
                    ?? doc.DocumentNode.SelectSingleNode("//i[contains(@class, 'fa-user')]/parent::*");

            if (node != null)
            {
                string cleanText = Regex.Replace(node.InnerText, @"\s+", " ").Trim();
                cleanText = Regex.Replace(cleanText, @"^(piloted by|by|Player:|Pilot:)\s*", "", RegexOptions.IgnoreCase).Trim();
                if (!string.IsNullOrWhiteSpace(cleanText))
                    return cleanText;
            }

            return "Unknown Pilot";
        }

        private string ExtractPlacementFromDoc(HtmlDocument doc)
        {
            var node = doc.DocumentNode.SelectSingleNode("//span[contains(@class, 'deck-metadata-child') and .//i[contains(@class, 'fa-trophy')]]")
                    ?? doc.DocumentNode.SelectSingleNode("//span[contains(@class, 'deck-metadata-child') and contains(., 'Reached')]")
                    ?? doc.DocumentNode.SelectSingleNode("//span[contains(@class, 'deck-metadata-child') and .//a[contains(@href, '/tournament/')]]")
                    ?? doc.DocumentNode.SelectSingleNode("//a[contains(@href, '/tournament/') and not(contains(text(), 'Meta'))]");

            if (node != null)
            {
                string cleanText = Regex.Replace(node.InnerText, @"\s+", " ").Trim();
                if (!string.IsNullOrWhiteSpace(cleanText) && !cleanText.StartsWith("Tournament Meta", StringComparison.OrdinalIgnoreCase))
                {
                    return cleanText;
                }
            }

            return "Tournament Meta Deck";
        }

        private List<string> ExtractCardIdsFromNode(HtmlNode? containerNode)
        {
            var cardIds = new List<string>();
            if (containerNode == null) return cardIds;

            var imgNodes = containerNode.SelectNodes(".//img[@data-src or @src or @data-card-id]");

            if (imgNodes != null)
            {
                foreach (var img in imgNodes)
                {
                    string src = img.GetAttributeValue("data-src", img.GetAttributeValue("src", string.Empty));
                    string cardId = img.GetAttributeValue("data-card-id", string.Empty);

                    if (string.IsNullOrEmpty(cardId) && !string.IsNullOrEmpty(src))
                    {
                        cardId = Path.GetFileNameWithoutExtension(src);
                    }

                    if (Regex.IsMatch(cardId, @"^\d{7,8}$"))
                    {
                        cardIds.Add(cardId);
                    }
                }
            }

            return cardIds;
        }

        private (List<string> Main, List<string> Extra, List<string> Side) ParseYdkContent(string ydkContent)
        {
            var main = new List<string>();
            var extra = new List<string>();
            var side = new List<string>();

            string currentSection = "main";
            var lines = ydkContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);

            foreach (var rawLine in lines)
            {
                string line = rawLine.Trim();

                if (line.StartsWith("#main", StringComparison.OrdinalIgnoreCase))
                    currentSection = "main";
                else if (line.StartsWith("#extra", StringComparison.OrdinalIgnoreCase))
                    currentSection = "extra";
                else if (line.StartsWith("!side", StringComparison.OrdinalIgnoreCase))
                    currentSection = "side";
                else if (Regex.IsMatch(line, @"^\d{7,8}$"))
                {
                    if (currentSection == "main") main.Add(line);
                    else if (currentSection == "extra") extra.Add(line);
                    else if (currentSection == "side") side.Add(line);
                }
            }

            return (main, extra, side);
        }
    }
}