package scraper

import (
	"encoding/json"
	"fmt"
	"net/http"
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
	ttl: 6 * time.Hour,
}

type mdmCardApiResponse struct {
	Name      string `json:"name"`
	BanStatus string `json:"banStatus"`
}

func FetchMasterDuelBanList() (*BanListResponse, error) {
	cache.mu.RLock()
	if cache.data != nil && time.Since(cache.updatedAt) < cache.ttl {
		defer cache.mu.RUnlock()
		return cache.data, nil
	}
	cache.mu.RUnlock()

	targetURL := "https://www.masterduelmeta.com/api/v1/cards?tcgBanStatus[$or][$exists]=true&ocgBanStatus[$or][$exists]=true&banStatus[$or][$exists]=true&alternateArt[$ne]=true&limit=0"

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Referer", "https://www.masterduelmeta.com/")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http execution failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("MasterDuelMeta API returned HTTP status %d", resp.StatusCode)
	}

	var apiCards []mdmCardApiResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiCards); err != nil {
		return nil, fmt.Errorf("failed to decode JSON response: %w", err)
	}

	var entries []MDMBanListEntry
	for _, card := range apiCards {
		normStatus := normalizeStatus(card.BanStatus)
		if normStatus != "Unlimited" && card.Name != "" {
			entries = append(entries, MDMBanListEntry{
				Name:   card.Name,
				Status: normStatus,
			})
		}
	}

	if len(entries) == 0 {
		return nil, fmt.Errorf("api returned 0 restricted cards")
	}

	result := &BanListResponse{
		Format:    "Master Duel",
		Source:    "https://www.masterduelmeta.com/forbidden-limited-list",
		UpdatedAt: time.Now(),
		Count:     len(entries),
		Cards:     entries,
	}

	cache.mu.Lock()
	cache.data = result
	cache.updatedAt = time.Now()
	cache.mu.Unlock()

	return result, nil
}

func normalizeStatus(raw string) string {
	s := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case strings.Contains(s, "ban"), strings.Contains(s, "forbid"), s == "0", s == "forbidden":
		return "Forbidden"
	case (strings.Contains(s, "limit") && !strings.Contains(s, "semi")), s == "1", s == "limited":
		return "Limited"
	case strings.Contains(s, "semi"), s == "2", s == "semi-limited":
		return "Semi-Limited"
	default:
		return "Unlimited"
	}
}

func normalizeString(s string) string {
	// Simple lowercase helper
	return s
}

func containsAny(s string, substrings ...string) bool {
	for _, sub := range substrings {
		if len(s) >= len(sub) && (s == sub || len(sub) == 0) {
			return true
		}
	}
	return false
}
