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

        public MetaDeckScraperService(HttpClient httpClient, ILogger<MetaDeckScraperService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            // Configure browser-like headers to prevent Cloudflare/anti-bot blocks
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

        public async Task<List<MetaDeck>> ScrapeTcgMetaDecksAsync()
        {
            var metaDecks = new List<MetaDeck>();

            // Primary & Fallback Category Routes
            string[] categoryUrls = new[]
            {
                "https://ygoprodeck.com/category/format/tournament%20meta%20decks",
                "https://ygoprodeck.com/category/decks/tournament-meta-decks"
            };

            HtmlDocument? doc = null;
            string selectedUrl = string.Empty;

            // Attempt Pass 1 across candidate category URLs
            foreach (var url in categoryUrls)
            {
                try
                {
                    _logger.LogInformation("Pass 1: Attempting to fetch category grid from {Url}", url);
                    string html = await _httpClient.GetStringAsync(url);

                    if (!string.IsNullOrWhiteSpace(html))
                    {
                        var tempDoc = new HtmlDocument();
                        tempDoc.LoadHtml(html);

                        // Verify if deck links exist on this route
                        var nodes = tempDoc.DocumentNode.SelectNodes("//a[contains(@href, '/deck/')]");
                        if (nodes != null && nodes.Any())
                        {
                            doc = tempDoc;
                            selectedUrl = url;
                            break;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to fetch category grid from {Url}: {Message}", url, ex.Message);
                }
            }

            if (doc == null)
            {
                _logger.LogError("Pass 1 Failed: Could not harvest deck links from any category route.");
                return metaDecks;
            }

            // Harvest and deduplicate deck detail links
            var deckLinkNodes = doc.DocumentNode.SelectNodes("//a[contains(@href, '/deck/')]");
            if (deckLinkNodes == null || !deckLinkNodes.Any())
            {
                _logger.LogWarning("No deck links found on page: {Url}", selectedUrl);
                return metaDecks;
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
                .Take(10)
                .ToList();

            _logger.LogInformation("Pass 1 Complete: Found {Count} distinct deck links. Starting Pass 2...", distinctLinks.Count);

            // Pass 2: Iterate through distinct decks and scrape card breakdown
            foreach (var link in distinctLinks)
            {
                string fullDeckUrl = link.Href.StartsWith("http") ? link.Href : $"https://ygoprodeck.com{link.Href}";

                var (mainDeck, extraDeck, sideDeck) = await ScrapeDeckDetailsAsync(fullDeckUrl);

                string metaId = Guid.NewGuid().ToString();
                string archetype = string.IsNullOrWhiteSpace(link.Text) ? "Tournament Meta Deck" : link.Text;

                metaDecks.Add(new MetaDeck
                {
                    Id = metaId,
                    Archetype = archetype,
                    Format = "TCG",
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
                    LastUpdated = DateTime.UtcNow
                });

                _logger.LogInformation("Parsed '{Archetype}' -> Main: {MainCount}, Extra: {ExtraCount}, Side: {SideCount}",
                    archetype, mainDeck.Count, extraDeck.Count, sideDeck.Count);

                // Rate-limiting throttle pause
                await Task.Delay(500);
            }

            return metaDecks;
        }

        private async Task<(List<string> Main, List<string> Extra, List<string> Side)> ScrapeDeckDetailsAsync(string deckUrl)
        {
            // Attempt 1: YDK Direct Download API (Primary Route)
            var deckIdMatch = Regex.Match(deckUrl, @"-(\d+)$");
            if (deckIdMatch.Success)
            {
                string deckId = deckIdMatch.Groups[1].Value;
                string[] ydkUrls = new[]
                {
                    $"https://ygoprodeck.com/api/deck/downloadYDK.php?file={deckId}",
                    $"https://ygoprodeck.com/api/deck/downloadYDK.php?deck_id={deckId}"
                };

                foreach (var ydkUrl in ydkUrls)
                {
                    try
                    {
                        await Task.Delay(300); // Rate throttle
                        string ydkContent = await _httpClient.GetStringAsync(ydkUrl);

                        if (!string.IsNullOrWhiteSpace(ydkContent) && ydkContent.Contains("#main"))
                        {
                            var ydkResult = ParseYdkContent(ydkContent);
                            if (ydkResult.Main.Any())
                            {
                                return ydkResult;
                            }
                        }
                    }
                    catch
                    {
                        // Fall back to next YDK URL or DOM parsing
                    }
                }
            }

            // Attempt 2: DOM Parsing Fallback (Isolated Container Scoping)
            var mainDeck = new List<string>();
            var extraDeck = new List<string>();
            var sideDeck = new List<string>();

            try
            {
                await Task.Delay(300); // Rate throttle
                string html = await _httpClient.GetStringAsync(deckUrl);
                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                // Scoped container queries
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
                _logger.LogWarning(ex, "Failed to scrape deck details from DOM: {Url}", deckUrl);
            }

            return (mainDeck, extraDeck, sideDeck);
        }

        private List<string> ExtractCardIdsFromNode(HtmlNode? containerNode)
        {
            var cardIds = new List<string>();
            if (containerNode == null) return cardIds;

            // Restrict search strictly to descendants of containerNode using leading dot (.//img)
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