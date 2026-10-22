package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func newHealthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	registerHealth(r)
	return r
}

func TestLiveAndReadyAnswer200(t *testing.T) {
	r := newHealthRouter()
	for _, path := range []string{"/health/live", "/health/ready"} {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
		if w.Code != http.StatusOK {
			t.Errorf("%s: got %d, want 200", path, w.Code)
		}
	}
}

func TestHealthReportMatchesTheDotNetShape(t *testing.T) {
	w := httptest.NewRecorder()
	newHealthRouter().ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/health", nil))

	var body struct {
		Status    string        `json:"status"`
		CheckedAt string        `json:"checkedAt"`
		Checks    []interface{} `json:"checks"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("not JSON: %v", err)
	}
	if body.Status != "Healthy" || body.CheckedAt == "" || body.Checks == nil {
		t.Errorf("unexpected body: %s", w.Body.String())
	}
	if got := w.Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("Cache-Control = %q, want no-store", got)
	}
}

func TestHealthPathsAreLeftOutOfTraces(t *testing.T) {
	for path, want := range map[string]bool{
		"/": true, "/health": true, "/health/live": true, "/health/ready": true,
		"/healthy-cards": false, "/api/scrape-news": false,
	} {
		if got := isHealthPath(path); got != want {
			t.Errorf("isHealthPath(%q) = %v, want %v", path, got, want)
		}
	}
}
