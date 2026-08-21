package scraper

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"erregeteygo/worker/models"
)

func ScrapeMetaDecks(targetURL string) ([]models.MetaDeck, error) {
	// Simple HTTP client (no cookie jars or complex sessions needed anymore)
	client := &http.Client{Timeout: 20 * time.Second}
	var allMetaDecks []models.MetaDeck
	maxPages := 10

	// All 4 formats explicitly routed through the high-speed JSON API
	apiFormats := map[string]string{
		"TCG":         "tournament meta decks",
		"OCG":         "tournament meta decks ocg",
		"MASTER DUEL": "master duel decks",
		"GENESYS":     "tournament meta decks (genesys)",
	}

	for formatKey, formatParam := range apiFormats {
		fmt.Printf("\n[Go API Scraper] Starting format '%s'\n", formatKey)

		seenIDs := make(map[string]bool)
		pageDecksCollected := 0

		for page := 1; page <= maxPages; page++ {
			offset := (page - 1) * 21
			encodedFormat := strings.ReplaceAll(url.QueryEscape(formatParam), "+", "%20")
			apiURL := fmt.Sprintf("https://ygoprodeck.com/api/decks/getDecks.php?limit=21&offset=%d&format=%s&tournament", offset, encodedFormat)

			fmt.Printf("[Go API Scraper] Fetching page %d for '%s' from %s\n", page, formatKey, apiURL)

			req, err := http.NewRequest("GET", apiURL, nil)
			if err != nil {
				break
			}

			// Standard headers to bypass basic server rejection
			req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
			req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
			req.Header.Set("X-Requested-With", "XMLHttpRequest")

			resp, err := client.Do(req)
			if err != nil || resp.StatusCode != http.StatusOK {
				if resp != nil {
					resp.Body.Close()
				}
				break
			}

			bodyBytes, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				break
			}

			// Flexible JSON parsing
			var rawItems []map[string]interface{}
			err = json.Unmarshal(bodyBytes, &rawItems)

			// If wrapped inside an object (e.g., {"data": [...]}), unwrap it
			if err != nil {
				var wrapper map[string]interface{}
				if errObj := json.Unmarshal(bodyBytes, &wrapper); errObj == nil {
					for _, key := range []string{"data", "decks", "results", "items"} {
						if val, ok := wrapper[key]; ok {
							if arr, isArr := val.([]interface{}); isArr {
								for _, v := range arr {
									if mapVal, isMap := v.(map[string]interface{}); isMap {
										rawItems = append(rawItems, mapVal)
									}
								}
								break
							}
						}
					}
				}
			}

			if len(rawItems) == 0 {
				fmt.Printf("[Go API Scraper] Reached end of archive for '%s' at page %d.\n", formatKey, page)
				break
			}

			pageDecksFound := 0
			for _, item := range rawItems {
				// 1. EXTRACT EXACT ID (deckNum)
				deckNumVal, ok := item["deckNum"]
				if !ok || deckNumVal == nil {
					continue
				}
				idStr := fmt.Sprintf("%v", deckNumVal)

				if idStr == "" || idStr == "0" || seenIDs[idStr] {
					continue
				}
				seenIDs[idStr] = true

				// 2. EXTRACT DECK NAME (deck_name)
				archetype := fmt.Sprintf("%v", item["deck_name"])
				if strings.TrimSpace(archetype) == "" || archetype == "<nil>" {
					archetype = fmt.Sprintf("%s Meta Deck", formatKey)
				}

				// 3. EXTRACT PILOT (tournamentPlayerName fallback to username)
				pilot := fmt.Sprintf("%v", item["tournamentPlayerName"])
				if pilot == "" || pilot == "<nil>" {
					pilot = fmt.Sprintf("%v", item["username"])
				}
				if pilot == "" || pilot == "<nil>" {
					pilot = "Unknown Pilot"
				}

				// 4. EXTRACT PLACEMENT, TOURNAMENT NAME, & YEAR
				placement := fmt.Sprintf("%v", item["tournamentPlacement"])
				if placement == "" || placement == "<nil>" {
					placement = "Tournament Meta Deck"
				}

				tournamentName := fmt.Sprintf("%v", item["tournamentName"])
				if tournamentName == "" || tournamentName == "<nil>" {
					tournamentName = fmt.Sprintf("%v", item["tournament"])
				}
				if tournamentName == "" || tournamentName == "<nil>" {
					tournamentName = "Official Tournament"
				}

				// Extract year from available date fields with fallback to current year
				year := ""
				for _, dateKey := range []string{"tournamentDate", "date", "created_at"} {
					if dateVal, exists := item[dateKey]; exists && dateVal != nil {
						dateStr := fmt.Sprintf("%v", dateVal)
						if len(dateStr) >= 4 {
							year = dateStr[:4]
							break
						}
					}
				}
				if year == "" {
					year = fmt.Sprintf("%d", time.Now().Year())
				}

				// Format as: placement + " at " + tournamentName + " " + year
				formattedPlacement := fmt.Sprintf("%s at %s %s", placement, tournamentName, year)

				// 5. PARSE EMBEDDED CARD LISTS DIRECTLY FROM API JSON
				parseDeckArray := func(key string) []string {
					var cards []string
					if val, exists := item[key]; exists && val != nil {
						_ = json.Unmarshal([]byte(fmt.Sprintf("%v", val)), &cards)
					}
					return cards
				}

				mainDeck := parseDeckArray("main_deck")
				extraDeck := parseDeckArray("extra_deck")
				sideDeck := parseDeckArray("side_deck")

				// Ensure newer decks get more recent timestamps to preserve frontend sorting
				adjustedTime := time.Now().Add(-time.Duration(len(allMetaDecks)) * time.Second)

				// 6. BUILD THE MODEL
				metaDeck := models.MetaDeck{
					ID:                       idStr,
					Archetype:                archetype,
					Format:                   formatKey,
					Tier:                     "Tier 1",
					RepresentationPercentage: 15.0,
					Pilot:                    pilot,
					Placement:                formattedPlacement,
					LastUpdated:              adjustedTime,
					SampleDeck: models.DeckList{
						Title:     archetype,
						UserID:    "",
						MainDeck:  mainDeck,
						ExtraDeck: extraDeck,
						SideDeck:  sideDeck,
					},
				}

				allMetaDecks = append(allMetaDecks, metaDeck)
				pageDecksFound++
				pageDecksCollected++
			}

			fmt.Printf("[Go API Scraper] Page %d for '%s' yielded %d new distinct decks.\n", page, formatKey, pageDecksFound)
			if pageDecksFound == 0 {
				break
			}

			// Polite delay between pages
			time.Sleep(300 * time.Millisecond)
		}

		fmt.Printf("[Go API Scraper] Completed format '%s'. Total valid decks extracted: %d\n", formatKey, pageDecksCollected)
	}

	return allMetaDecks, nil
}
