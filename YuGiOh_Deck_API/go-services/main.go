package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"erregeteygo/worker/scraper"
	"erregeteygo/worker/syncer"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

type ImageSyncRequest struct {
	CardIDs []string `json:"cardIds"`
}

// work returns the context for a handler's scraping/syncing: it carries the request's trace, so outbound
// calls show up under the caller's trace, but it is not cancelled when the caller hangs up. Long jobs such
// as a full image sync keep running after the Deck API's HTTP timeout, as they always have.
func work(c *gin.Context) context.Context {
	return context.WithoutCancel(c.Request.Context())
}

func main() {
	shutdownTelemetry := setupTelemetry(context.Background())
	defer shutdownTelemetry(context.Background())

	r := gin.Default()

	// One span per request, continuing the caller's trace. Health checks and the "/" probe are left out.
	r.Use(otelgin.Middleware(serviceName, otelgin.WithFilter(func(req *http.Request) bool {
		return !isHealthPath(req.URL.Path)
	})))

	registerHealth(r)

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "online", "service": "go-worker"})
	})

	r.GET("/internal/banlist/masterduel", func(c *gin.Context) {
		banList, err := scraper.FetchMasterDuelBanList(work(c))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Master Duel Scraper failed",
				"details": err.Error(),
			})
			return
		}

		log.Printf("Successfully scraped %d cards for Master Duel Banlist", banList.Count)

		c.JSON(http.StatusOK, banList)
	})

	r.POST("/api/scrape-meta-decks", func(c *gin.Context) {
		decks, err := scraper.ScrapeMetaDecks(work(c), "")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"count": len(decks),
			"decks": decks,
		})
	})

	r.POST("/api/scrape-news", func(c *gin.Context) {
		articles, err := scraper.ScrapeNewsFeeds(work(c))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"count":    len(articles),
			"articles": articles,
		})
	})

	r.POST("/api/v1/sync-card-images", func(c *gin.Context) {
		blobConnStr := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
		var req ImageSyncRequest

		_ = c.ShouldBindJSON(&req)

		var syncedCount int
		var err error

		if len(req.CardIDs) > 0 {
			syncedCount, err = syncer.SyncCardImagesConcurrently(work(c), req.CardIDs, blobConnStr, "card-images")
		} else {
			syncedCount, err = syncer.SyncAllMissingCardImages(work(c), blobConnStr, "card-images")
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

	r.POST("/api/v1/sync-card-images/:cardId", func(c *gin.Context) {
		cardID := c.Param("cardId")
		blobConnStr := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")

		err := syncer.SyncSingleCardImage(work(c), cardID, blobConnStr, "card-images")
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
