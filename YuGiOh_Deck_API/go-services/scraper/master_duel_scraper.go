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

// flexString reads a JSON string OR number into a string. Master Duel Meta sends some ids as numbers
// ("konamiID": 12345) and others as strings ("12345"); a plain string field fails on the numbers, which
// used to cut the download off at the last page (the newest cards).
type flexString string

func (f *flexString) UnmarshalJSON(data []byte) error {
	s := strings.TrimSpace(string(data))
	if s == "null" {
		*f = ""
		return nil
	}
	if strings.HasPrefix(s, `"`) {
		var str string
		if err := json.Unmarshal(data, &str); err != nil {
			return err
		}
		*f = flexString(str)
		return nil
	}
	*f = flexString(s) // a number: keep its digits as text
	return nil
}

type MDMCardEntity struct {
	KonamiID     flexString    `json:"konamiID"`
	GameID       flexString    `json:"gameId"`
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

// Master Duel Meta has well over 10,000 cards. A download with far fewer means a page was cut off
// (for example by Cloudflare), and saving it would wipe real cards from the database.
const minExpectedCards = 5000

func fetchPage(client *http.Client, limit, skip int) ([]MDMCardEntity, error) {
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
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("MasterDuelMeta API returned HTTP status %d", resp.StatusCode)
	}

	var batch []MDMCardEntity
	// Cloudflare can answer 200 OK with an HTML page, which fails to decode here.
	if err := json.NewDecoder(resp.Body).Decode(&batch); err != nil {
		return nil, fmt.Errorf("failed to decode JSON response: %w", err)
	}
	return batch, nil
}

func FetchMasterDuelBanList() (*MasterDuelDatabaseSyncResponse, error) {
	var allCards []MDMCardEntity
	skip := 0
	limit := 3000

	client := &http.Client{Timeout: 60 * time.Second}

	for {
		// Retry each page a few times before giving up on the whole download.
		var batch []MDMCardEntity
		var err error
		for attempt := 1; attempt <= 3; attempt++ {
			batch, err = fetchPage(client, limit, skip)
			if err == nil {
				break
			}
			fmt.Printf("Page at skip %d failed (attempt %d/3): %v\n", skip, attempt, err)
			time.Sleep(time.Duration(attempt) * 5 * time.Second)
		}
		if err != nil {
			// Do not return a partial list: the caller would treat it as a complete sync.
			return nil, fmt.Errorf("download incomplete at skip %d after %d cards: %w", skip, len(allCards), err)
		}

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

	if len(allCards) < minExpectedCards {
		return nil, fmt.Errorf("only %d cards downloaded (expected at least %d); refusing to use a partial list", len(allCards), minExpectedCards)
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
	case strings.HasPrefix(s, "unlimited"):
		return "Unlimited"
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
