package scraper

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
)

type MDMBanListEntry struct {
	Name   string `json:"name"`
	Status string `json:"status"` // "Forbidden", "Limited", "Semi-Limited"
}

type BanListResponse struct {
	Format    string            `json:"format"`
	Source    string            `json:"source"`
	UpdatedAt time.Time         `json:"updatedAt"`
	Count     int               `json:"count"`
	Cards     []MDMBanListEntry `json:"cards"`
}

type BanListCache struct {
	mu        sync.RWMutex
	data      *BanListResponse
	updatedAt time.Time
	ttl       time.Duration
}

var cache = BanListCache{
	ttl: 6 * time.Hour, // Re-scrape every 6 hours
}

func FetchMasterDuelBanList() (*BanListResponse, error) {
	cache.mu.RLock()
	if cache.data != nil && time.Since(cache.updatedAt) < cache.ttl {
		defer cache.mu.RUnlock()
		return cache.data, nil
	}
	cache.mu.RUnlock()

	targetURL := "https://www.masterduelmeta.com/forbidden-limited-list"

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}

	// Browser headers to prevent Cloudflare 403 blocks
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/json;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://www.masterduelmeta.com/")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http execution failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("MasterDuelMeta returned HTTP status %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read body: %w", err)
	}

	cards := parseMDMPageData(string(bodyBytes))
	if len(cards) == 0 {
		return nil, fmt.Errorf("failed to extract cards from HTML payload")
	}

	result := &BanListResponse{
		Format:    "Master Duel",
		Source:    targetURL,
		UpdatedAt: time.Now(),
		Count:     len(cards),
		Cards:     cards,
	}

	cache.mu.Lock()
	cache.data = result
	cache.updatedAt = time.Now()
	cache.mu.Unlock()

	return result, nil
}

func parseMDMPageData(htmlContent string) []MDMBanListEntry {
	cardMap := make(map[string]string)

	// Extract embedded JSON script tag payload
	nextDataRegex := regexp.MustCompile(`<script id="__NEXT_DATA__" type="application/json">(.*?)</script>`)
	matches := nextDataRegex.FindStringSubmatch(htmlContent)

	if len(matches) > 1 {
		var nextData map[string]interface{}
		if err := json.Unmarshal([]byte(matches[1]), &nextData); err == nil {
			extractCardsFromJSONMap(nextData, cardMap)
		}
	}

	// Regex pattern fallback
	if len(cardMap) == 0 {
		pairRegex := regexp.MustCompile(`"name"\s*:\s*"([^"]+)"\s*,\s*"(?:banStatus|status|list)"\s*:\s*"([^"]+)"`)
		pairMatches := pairRegex.FindAllStringSubmatch(htmlContent, -1)
		for _, match := range pairMatches {
			if len(match) == 3 {
				cardMap[match[1]] = normalizeStatus(match[2])
			}
		}
	}

	var results []MDMBanListEntry
	for name, status := range cardMap {
		results = append(results, MDMBanListEntry{
			Name:   name,
			Status: status,
		})
	}

	return results
}

func extractCardsFromJSONMap(data interface{}, cardMap map[string]string) {
	switch v := data.(type) {
	case map[string]interface{}:
		name, nameOk := v["name"].(string)
		statusVal, statusOk := v["banStatus"].(string)
		if !statusOk {
			statusVal, statusOk = v["status"].(string)
		}

		if nameOk && statusOk && name != "" {
			norm := normalizeStatus(statusVal)
			if norm != "Unlimited" {
				cardMap[name] = norm
			}
		}

		for _, child := range v {
			extractCardsFromJSONMap(child, cardMap)
		}
	case []interface{}:
		for _, item := range v {
			extractCardsFromJSONMap(item, cardMap)
		}
	}
}

func normalizeStatus(raw string) string {
	s := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case strings.Contains(s, "ban"), strings.Contains(s, "forbid"), s == "0":
		return "Forbidden"
	case strings.Contains(s, "limit") && !strings.Contains(s, "semi"), s == "1":
		return "Limited"
	case strings.Contains(s, "semi"), s == "2":
		return "Semi-Limited"
	default:
		return "Unlimited"
	}
}

func MasterDuelBanListHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	banList, err := FetchMasterDuelBanList()
	if err != nil {
		log.Printf("[MasterDuelScraper Error] %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error":   "Master Duel Scraper failed",
			"details": err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(banList)
}

func main() {
	port := os.Getenv("SCRAPER_PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/internal/banlist/masterduel", MasterDuelBanListHandler)

	log.Printf("🤖 Go Master Duel Scraper active on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
