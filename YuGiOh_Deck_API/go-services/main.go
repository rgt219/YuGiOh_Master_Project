package main

import (
	"net/http"
	"os"

	"erregeteygo/worker/scraper"
	"erregeteygo/worker/syncer"

	"github.com/gin-gonic/gin"
)

type ImageSyncRequest struct {
	CardIDs []string `json:"cardIds"`
}

func main() {
	r := gin.Default()

	// Health Check
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "online", "service": "go-worker"})
	})

	// Meta Deck Scraper Route
	r.POST("/api/v1/scrape-meta-decks", func(c *gin.Context) {
		decks, err := scraper.ScrapeMetaDecks("")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"count": len(decks),
			"decks": decks,
		})
	})

	// Full Catalog OR Specific List Image Sync Route
	r.POST("/api/v1/sync-card-images", func(c *gin.Context) {
		blobConnStr := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
		var req ImageSyncRequest

		// Bind optional body
		_ = c.ShouldBindJSON(&req)

		var syncedCount int
		var err error

		if len(req.CardIDs) > 0 {
			// Sync specific card IDs list
			syncedCount, err = syncer.SyncCardImagesConcurrently(req.CardIDs, blobConnStr, "card-images")
		} else {
			// Full master catalog sync matching CardImageSyncService.cs
			syncedCount, err = syncer.SyncAllMissingCardImages(blobConnStr, "card-images")
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":      "success",
			"syncedCount": syncedCount,
		})
	})

	// Single Card Image Sync Route
	r.POST("/api/v1/sync-card-images/:cardId", func(c *gin.Context) {
		cardID := c.Param("cardId")
		blobConnStr := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")

		err := syncer.SyncSingleCardImage(cardID, blobConnStr, "card-images")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"cardId": cardID,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
