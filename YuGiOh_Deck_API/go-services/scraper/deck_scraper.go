package scraper

import (
	"bufio"
	"fmt"
	"net/http"
	"path"
	"regexp"
	"strings"
	"time"

	"erregeteygo/worker/models"

	"github.com/PuerkitoBio/goquery"
)

// Map format keys to YGOProDeck category routes
var formatURLs = map[string]string{
	"TCG":         "https://ygoprodeck.com/category/format/tournament%20meta%20decks",
	"OCG":         "https://ygoprodeck.com/category/format/tournament%20meta%20decks%20ocg%20%28asian-english%29",
	"MASTER DUEL": "https://ygoprodeck.com/category/format/master%20duel%20decks",
	"GENESYS":     "https://ygoprodeck.com/category/format/tournament%20meta%20decks%20%28genesys%29",
}

var (
	deckIDRegex   = regexp.MustCompile(`-(\d+)$`)
	cardIDRegex   = regexp.MustCompile(`^\d{6,9}$`)
	cleanWSRegex  = regexp.MustCompile(`\s+`)
	pilotPrefix   = regexp.MustCompile(`(?i)^(piloted by|by|Player:|Pilot:)\s*`)
	imageURLRegex = regexp.MustCompile(`(?:cards|cards_small)/(\d{6,9})\.jpg`)
)

// ScrapeMetaDecks executes the 2-pass scraping pipeline matching MetaDeckScraperService.cs
func ScrapeMetaDecks(targetURL string) ([]models.MetaDeck, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	var allMetaDecks []models.MetaDeck

	for formatKey, categoryURL := range formatURLs {
		fmt.Printf("[Go Scraper] Pass 1: Fetching category grid for format '%s' from %s\n", formatKey, categoryURL)

		doc, err := fetchAndParseHTML(client, categoryURL)
		if err != nil {
			fmt.Printf("[Go Scraper Error] Failed to fetch %s: %v\n", formatKey, err)
			continue
		}

		// Extract distinct deck links
		seenHrefs := make(map[string]bool)
		type deckLink struct {
			Href string
			Text string
		}
		var distinctLinks []deckLink

		doc.Find("a[href*='/deck/']").Each(func(i int, s *goquery.Selection) {
			href, exists := s.Attr("href")
			text := strings.TrimSpace(s.Text())

			if exists && strings.Contains(href, "/deck/") && !seenHrefs[href] {
				seenHrefs[href] = true
				distinctLinks = append(distinctLinks, deckLink{Href: href, Text: text})
			}
		})

		fmt.Printf("[Go Scraper] Found %d distinct deck links for format '%s'. Starting Pass 2...\n", len(distinctLinks), formatKey)

		for _, link := range distinctLinks {
			fullURL := link.Href
			if !strings.HasPrefix(fullURL, "http") {
				fullURL = "https://ygoprodeck.com" + link.Href
			}

			// Pass 2: Scrape individual deck details
			mainDeck, extraDeck, sideDeck, pilot, placement := scrapeDeckDetails(client, fullURL)

			archetype := link.Text
			if strings.TrimSpace(archetype) == "" {
				archetype = fmt.Sprintf("%s Meta Deck", formatKey)
			}

			metaDeck := models.MetaDeck{
				Archetype:                archetype,
				Format:                   formatKey,
				Tier:                     "Tier 1",
				RepresentationPercentage: 15.0,
				Pilot:                    pilot,
				Placement:                placement,
				LastUpdated:              time.Now(),
				SampleDeck: models.DeckList{
					Title:     archetype,
					UserID:    "",
					MainDeck:  mainDeck,
					ExtraDeck: extraDeck,
					SideDeck:  sideDeck,
				},
			}

			allMetaDecks = append(allMetaDecks, metaDeck)
			fmt.Printf("[Go Scraper] Parsed '%s' (%s) -> Pilot: %s, Placement: %s (Main: %d, Extra: %d, Side: %d)\n",
				archetype, formatKey, pilot, placement, len(mainDeck), len(extraDeck), len(sideDeck))

			time.Sleep(300 * time.Millisecond) // Polite rate-limit delay
		}
	}

	return allMetaDecks, nil
}

func scrapeDeckDetails(client *http.Client, deckURL string) ([]string, []string, []string, string, string) {
	doc, err := fetchAndParseHTML(client, deckURL)
	pilot := "Unknown Pilot"
	placement := "Tournament Meta Deck"

	if err == nil && doc != nil {
		pilot = extractPilot(doc)
		placement = extractPlacement(doc)
	}

	// 1. Try Direct YDK Download First (Strip query params first, e.g. ?view=grid)
	cleanURL := strings.Split(deckURL, "?")[0]
	matches := deckIDRegex.FindStringSubmatch(cleanURL)
	if len(matches) > 1 {
		deckID := matches[1]
		ydkURL := fmt.Sprintf("https://ygoprodeck.com/api/deck/downloadYDK.php?file=%s", deckID)

		main, extra, side, ydkErr := fetchAndParseYDK(client, ydkURL)
		if ydkErr == nil && len(main) > 0 {
			return main, extra, side, pilot, placement
		}
	}

	// 2. Fallback to DOM Card Extraction if YDK fails or is unavailable
	var mainDeck, extraDeck, sideDeck []string
	if doc != nil {
		// Expanded CSS selector list covering all YGOPRODeck layout variations
		mainNode := doc.Find(".main-deck, #main-deck, #deck-main, #main_deck, div[id*='main-deck']").First()
		extraNode := doc.Find(".extra-deck, #extra-deck, #deck-extra, #extra_deck, div[id*='extra-deck']").First()
		sideNode := doc.Find(".side-deck, #side-deck, #deck-side, #side_deck, div[id*='side-deck']").First()

		mainDeck = extractCardIDsFromSelection(mainNode)
		extraDeck = extractCardIDsFromSelection(extraNode)
		sideDeck = extractCardIDsFromSelection(sideNode)
	}

	return mainDeck, extraDeck, sideDeck, pilot, placement
}

func fetchAndParseYDK(client *http.Client, ydkURL string) ([]string, []string, []string, error) {
	req, err := http.NewRequest("GET", ydkURL, nil)
	if err != nil {
		return nil, nil, nil, err
	}
	setHeaders(req)

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return nil, nil, nil, fmt.Errorf("ydk fetch failed with status %d", resp.StatusCode)
	}
	defer resp.Body.Close()

	var main, extra, side []string
	currentSection := "main"
	cardIDPattern := regexp.MustCompile(`\d{6,9}`)

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		// Clean UTF-8 BOM and whitespace
		line := strings.TrimSpace(scanner.Text())
		line = strings.TrimPrefix(line, "\ufeff")

		if strings.HasPrefix(strings.ToLower(line), "#main") {
			currentSection = "main"
		} else if strings.HasPrefix(strings.ToLower(line), "#extra") {
			currentSection = "extra"
		} else if strings.HasPrefix(strings.ToLower(line), "!side") {
			currentSection = "side"
		} else if match := cardIDPattern.FindString(line); match != "" {
			switch currentSection {
			case "main":
				main = append(main, match)
			case "extra":
				extra = append(extra, match)
			case "side":
				side = append(side, match)
			}
		}
	}

	if len(main) == 0 && len(extra) == 0 {
		return nil, nil, nil, fmt.Errorf("no card IDs found in YDK content")
	}

	return main, extra, side, nil
}

func extractPilot(doc *goquery.Document) string {
	node := doc.Find("a[href*='by-player']").First()
	if node.Length() == 0 {
		node = doc.Find("i.fa-user").Parent().First()
	}

	if node.Length() > 0 {
		text := cleanWSRegex.ReplaceAllString(node.Text(), " ")
		text = pilotPrefix.ReplaceAllString(text, "")
		text = strings.TrimSpace(text)
		if text != "" {
			return text
		}
	}
	return "Unknown Pilot"
}

func extractPlacement(doc *goquery.Document) string {
	node := doc.Find("span.deck-metadata-child:has(i.fa-trophy), span.deck-metadata-child:contains('Reached'), a[href*='/tournament/']").First()
	if node.Length() > 0 {
		text := strings.TrimSpace(cleanWSRegex.ReplaceAllString(node.Text(), " "))
		if text != "" && !strings.HasPrefix(strings.ToLower(text), "tournament meta") {
			return text
		}
	}
	return "Tournament Meta Deck"
}

func extractCardIDsFromSelection(s *goquery.Selection) []string {
	var cardIDs []string
	if s.Length() == 0 {
		return cardIDs
	}

	s.Find("img, div[data-card-id], a[href*='/card/']").Each(func(i int, element *goquery.Selection) {
		// Check data-card-id first
		cardID, _ := element.Attr("data-card-id")

		if cardID == "" {
			// Check all lazy-load image attributes
			src, _ := element.Attr("data-src")
			if src == "" {
				src, _ = element.Attr("data-original")
			}
			if src == "" {
				src, _ = element.Attr("src")
			}

			// Extract numeric card ID from image URL path or filename
			matches := imageURLRegex.FindStringSubmatch(src)
			if len(matches) > 1 {
				cardID = matches[1]
			} else if src != "" {
				filename := path.Base(src)
				cardID = strings.TrimSuffix(filename, path.Ext(filename))
			}
		}

		if cardIDRegex.MatchString(cardID) {
			cardIDs = append(cardIDs, cardID)
		}
	})

	return cardIDs
}

func fetchAndParseHTML(client *http.Client, url string) (*goquery.Document, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	setHeaders(req)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	return goquery.NewDocumentFromReader(resp.Body)
}

func setHeaders(req *http.Request) {
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
}
