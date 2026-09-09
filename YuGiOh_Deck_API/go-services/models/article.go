package models

import "time"

// NewsArticle represents a single syndicated news story.
// The text inside the backticks (`json:"id"`) tells Go exactly what
// property name to use when converting this into JSON for your C# API.
type NewsArticle struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Source        string    `json:"source"`
	Author        string    `json:"author"`
	Description   string    `json:"description"`
	URL           string    `json:"url"`
	ImageURL      string    `json:"imageUrl"`
	PublishedDate time.Time `json:"publishedDate"`
	Categories    []string  `json:"categories"` // 🚀 Add this line
}
