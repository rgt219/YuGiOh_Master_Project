package main

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Same three endpoints and the same JSON shape as the .NET services (Shared/YuGiOh.ServiceDefaults/ServiceHealth.cs):
//
//	/health/live   the process is up (Azure's liveness probe)
//	/health/ready  it can take requests (Azure's readiness probe)
//	/health        dependency report for the site's /status page
//
// The worker has no dependency worth checking on every call: its outside calls (YGOPRODeck, Master Duel Meta, RSS
// feeds, Blob Storage) only happen during a scrape or sync, and pinging them here would cost requests for nothing.
func registerHealth(r *gin.Engine) {
	r.GET("/health/live", func(c *gin.Context) { c.String(http.StatusOK, "Alive") })
	r.GET("/health/ready", func(c *gin.Context) { c.String(http.StatusOK, "Ready") })
	r.GET("/health", func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		c.JSON(http.StatusOK, gin.H{
			"status":     "Healthy",
			"checkedAt":  time.Now().UTC().Format(time.RFC3339),
			"durationMs": 0,
			"checks":     []gin.H{},
		})
	})
}

// isHealthPath keeps health checks and the "/" status probe out of traces.
func isHealthPath(path string) bool {
	return path == "/" || path == "/health" || strings.HasPrefix(path, "/health/")
}
