package models

import "time"

// ==========================================
// 1. CardData.cs Models
// ==========================================

// CardImage represents image_url_small from CardData.cs
type CardImage struct {
	ImageUrlSmall string `json:"image_url_small" bson:"image_url_small"`
}

// CardData represents individual Yu-Gi-Oh! card details matching CardData.cs
type CardData struct {
	ID         int         `json:"id" bson:"_id,omitempty"`
	Name       string      `json:"name" bson:"name"`
	Type       string      `json:"type" bson:"type"`
	Desc       string      `json:"desc" bson:"desc"`
	Level      *int        `json:"level,omitempty" bson:"level,omitempty"`
	Atk        *int        `json:"atk,omitempty" bson:"atk,omitempty"`
	Def        *int        `json:"def,omitempty" bson:"def,omitempty"`
	Race       string      `json:"race" bson:"race"`
	Attribute  string      `json:"attribute" bson:"attribute"`
	CardImages []CardImage `json:"card_images" bson:"card_images"`
	Image      string      `json:"image" bson:"image"`
}

// HydratedDeckResponse represents a populated deck matching HydratedDeckResponse in CardData.cs
type HydratedDeckResponse struct {
	ID        string     `json:"id" bson:"id"`
	Title     string     `json:"title" bson:"title"`
	UserID    string     `json:"userId" bson:"userId"`
	MainDeck  []CardData `json:"mainDeck" bson:"mainDeck"`
	ExtraDeck []CardData `json:"extraDeck" bson:"extraDeck"`
	SideDeck  []CardData `json:"sideDeck" bson:"sideDeck"`
}

// ==========================================
// 2. CardStat.cs Model
// ==========================================

// CardStat represents card usage tracking metrics matching CardStat.cs
type CardStat struct {
	CardID      string         `json:"cardId" bson:"_id"`
	CardName    *string        `json:"cardName,omitempty" bson:"CardName,omitempty"`
	TotalUsage  int            `json:"totalUsage" bson:"TotalUsage"`
	LastSeen    time.Time      `json:"lastSeen" bson:"LastSeen"`
	LastUpdated time.Time      `json:"lastUpdated" bson:"LastUpdated"`
	DailyUsage  map[string]int `json:"dailyUsage" bson:"DailyUsage"`
}

// ==========================================
// 3. DeckList.cs Model
// ==========================================

// DeckList represents card ID lists matching DeckList.cs
type DeckList struct {
	ID        string   `json:"id,omitempty" bson:"_id,omitempty"`
	Title     string   `json:"title" bson:"title"`
	UserID    string   `json:"userId" bson:"userId"`
	MainDeck  []string `json:"mainDeck" bson:"mainDeck"`
	ExtraDeck []string `json:"extraDeck" bson:"extraDeck"`
	SideDeck  []string `json:"sideDeck" bson:"sideDeck"`
}

// ==========================================
// 4. MetaDeck.cs Model
// ==========================================

// MetaDeck represents archetype meta decks matching MetaDeck.cs
type MetaDeck struct {
	ID                       string    `json:"id" bson:"_id,omitempty"`
	Archetype                string    `json:"archetype" bson:"archetype"`
	Format                   string    `json:"format" bson:"format"`
	Tier                     string    `json:"tier" bson:"tier"`
	RepresentationPercentage float64   `json:"representationPercentage" bson:"representationPercentage"`
	SampleDeck               DeckList  `json:"sampleDeck" bson:"sampleDeck"`
	LastUpdated              time.Time `json:"lastUpdated" bson:"lastUpdated"`
	Pilot                    string    `json:"pilot,omitempty" bson:"pilot,omitempty"`
	Placement                string    `json:"placement,omitempty" bson:"placement,omitempty"`
}

// ==========================================
// 5. CardAnalytics.cs Model
// ==========================================

// CardAnalytics represents format inclusion analytics matching CardAnalytics.cs
type CardAnalytics struct {
	ID                 string    `json:"id,omitempty" bson:"_id,omitempty"`
	CardID             string    `json:"cardId" bson:"cardId"`
	Format             string    `json:"format" bson:"format"`
	DeckCount          int       `json:"deckCount" bson:"deckCount"`
	TotalDecksInFormat int       `json:"totalDecksInFormat" bson:"totalDecksInFormat"`
	InclusionRate      float64   `json:"inclusionRate" bson:"inclusionRate"`
	TotalCopies        int       `json:"totalCopies" bson:"totalCopies"`
	AvgCopies          float64   `json:"avgCopies" bson:"avgCopies"`
	LastUpdated        time.Time `json:"lastUpdated" bson:"lastUpdated"`
}
