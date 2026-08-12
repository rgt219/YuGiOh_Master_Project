package scraper

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type LinkedArticle struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Image string `json:"image"`
}

type SourceDetail struct {
	ID            string         `json:"_id"`
	Type          string         `json:"type"`
	Name          string         `json:"name"`
	Expires       *time.Time     `json:"expires"`
	LinkedArticle *LinkedArticle `json:"linkedArticle"`
}

type ObtainEntry struct {
	Amount int          `json:"amount"`
	Type   string       `json:"type"`
	Source SourceDetail `json:"source"`
}

type MDMCardEntity struct {
	KonamiID     string        `json:"konamiID"`
	GameID       string        `json:"gameId"`
	Name         string        `json:"name"`
	Type         string        `json:"type"`
	AlternateArt bool          `json:"alternateArt"`
	MonsterType  []string      `json:"monsterType"`
	Level        *int          `json:"level"`
	Race         string        `json:"race"`
	Attribute    string        `json:"attribute"`
	Atk          *int          `json:"atk"`
	Def          *int          `json:"def"`
	Description  string        `json:"description"`
	Rarity       string        `json:"rarity"`
	BanStatus    string        `json:"banStatus"`
	OcgBanStatus *string       `json:"ocgBanStatus"`
	TcgBanStatus *string       `json:"tcgBanStatus"`
	PopRank      float64       `json:"popRank"`
	Obtain       []ObtainEntry `json:"obtain"`
	UpdatedAt    time.Time     `json:"updatedAt"`
}

type MasterDuelDatabaseSyncResponse struct {
	Format    string          `json:"format"`
	UpdatedAt time.Time       `json:"updatedAt"`
	Count     int             `json:"count"`
	Cards     []MDMCardEntity `json:"cards"`
}

func FetchMasterDuelBanList() (*MasterDuelDatabaseSyncResponse, error) {
	// Pulls EVERY card instead of filtering out unlimited ones
	targetURL := "https://www.masterduelmeta.com/api/v1/cards?alternateArt[$ne]=true&limit=0"

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Referer", "https://www.masterduelmeta.com/")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http execution failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("MasterDuelMeta API returned HTTP status %d", resp.StatusCode)
	}

	var rawCards []MDMCardEntity
	if err := json.NewDecoder(resp.Body).Decode(&rawCards); err != nil {
		return nil, fmt.Errorf("failed to decode JSON response: %w", err)
	}

	now := time.Now()
	for i := range rawCards {
		rawCards[i].UpdatedAt = now
		if rawCards[i].BanStatus == "" {
			rawCards[i].BanStatus = "Unlimited"
		} else {
			rawCards[i].BanStatus = normalizeStatus(rawCards[i].BanStatus)
		}
	}

	return &MasterDuelDatabaseSyncResponse{
		Format:    "Master Duel Complete Database",
		UpdatedAt: now,
		Count:     len(rawCards),
		Cards:     rawCards,
	}, nil
}

func normalizeStatus(raw string) string {
	s := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case strings.Contains(s, "ban"), strings.Contains(s, "forbid"), s == "0", s == "forbidden":
		return "Forbidden"
	case strings.Contains(s, "limited 2"), strings.Contains(s, "semi"), s == "2":
		return "Semi-Limited"
	case strings.Contains(s, "limit"), s == "1", s == "limited":
		return "Limited"
	default:
		return "Unlimited"
	}
}
