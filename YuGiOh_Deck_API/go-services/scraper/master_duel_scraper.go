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
	var allCards []MDMCardEntity
	skip := 0
	limit := 3000

	client := &http.Client{Timeout: 30 * time.Second}

	for {
		targetURL := fmt.Sprintf("https://www.masterduelmeta.com/api/v1/cards?alternateArt[$ne]=true&limit=%d&skip=%d", limit, skip)

		req, err := http.NewRequest("GET", targetURL, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to build request: %w", err)
		}

		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Referer", "https://www.masterduelmeta.com/")

		resp, err := client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("http execution failed: %w", err)
		}

		// Check for explicit HTTP Error blocks
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			if len(allCards) > 0 {
				fmt.Printf("Notice: API returned %d at skip %d. Saving %d cards!\n", resp.StatusCode, skip, len(allCards))
				break
			}
			return nil, fmt.Errorf("MasterDuelMeta API returned HTTP status %d", resp.StatusCode)
		}

		var batch []MDMCardEntity
		// ⚡ THE FIX: Catch Cloudflare's 200 OK HTML pages right here!
		if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
			resp.Body.Close()
			if len(allCards) > 0 {
				fmt.Printf("Notice: JSON decode failed at skip %d (Likely Cloudflare HTML intercept). Safely saving %d cards!\n", skip, len(allCards))
				break
			}
			return nil, fmt.Errorf("failed to decode JSON response: %w", err)
		}
		resp.Body.Close()

		if len(batch) == 0 {
			break
		}

		allCards = append(allCards, batch...)
		fmt.Printf("Downloaded %d cards so far...\n", len(allCards))

		if len(batch) < limit {
			break
		}

		skip += limit
		time.Sleep(4 * time.Second)
	}

	fmt.Printf("====================================================\n")
	fmt.Printf("SUCCESS: Formatting and sending %d cards to C# API!\n", len(allCards))
	fmt.Printf("====================================================\n")

	now := time.Now()
	for i := range allCards {
		allCards[i].UpdatedAt = now
		if allCards[i].BanStatus == "" {
			allCards[i].BanStatus = "Unlimited"
		} else {
			allCards[i].BanStatus = normalizeStatus(allCards[i].BanStatus)
		}
	}

	return &MasterDuelDatabaseSyncResponse{
		Format:    "Master Duel Complete Database",
		UpdatedAt: now,
		Count:     len(allCards),
		Cards:     allCards,
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
