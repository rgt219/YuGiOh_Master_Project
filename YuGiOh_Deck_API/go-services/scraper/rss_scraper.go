package scraper

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"time"

	"erregeteygo/worker/models"

	"github.com/mmcdole/gofeed"
)

func ScrapeNewsFeeds() ([]models.NewsArticle, error) {
	fp := gofeed.NewParser()
	var allArticles []models.NewsArticle

	client := &http.Client{Timeout: 15 * time.Second}

	feeds := map[string]string{
		"YGOrganization": "https://ygorganization.com/feed/",
	}

	for sourceName, feedURL := range feeds {
		fmt.Printf("[Go RSS Scraper] Fetching news from %s...\n", sourceName)

		req, err := http.NewRequest("GET", feedURL, nil)
		if err != nil {
			continue
		}

		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		req.Header.Set("Accept", "application/rss+xml, application/xml, text/xml, */*")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			if resp != nil {
				resp.Body.Close()
			}
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}

		cleanBytes := bytes.ToValidUTF8(bodyBytes, []byte(""))
		feed, err := fp.Parse(bytes.NewReader(cleanBytes))
		if err != nil {
			continue
		}

		for _, item := range feed.Items {
			pubDate := time.Now()
			if item.PublishedParsed != nil {
				pubDate = *item.PublishedParsed
			}

			imageURL := ""

			// Fetch the actual article page to harvest its image
			if item.Link != "" {
				imageURL = fetchArticleImage(client, item.Link)
			}

			if imageURL == "" && item.Image != nil {
				imageURL = item.Image.URL
			}

			if imageURL != "" {
				fmt.Printf("[Image Found] %s -> %s\n", item.Title, imageURL)
			} else {
				fmt.Printf("[Image Missing] %s\n", item.Title)
			}

			authorName := sourceName
			if item.Author != nil && item.Author.Name != "" {
				authorName = item.Author.Name
			}

			article := models.NewsArticle{
				ID:            item.Link,
				Title:         item.Title,
				Source:        sourceName,
				Author:        authorName,
				Description:   item.Description,
				URL:           item.Link,
				ImageURL:      imageURL,
				PublishedDate: pubDate,
				Categories:    item.Categories,
			}

			allArticles = append(allArticles, article)
		}
	}

	fmt.Printf("[Go RSS Scraper] Completed! Extracted %d total articles.\n", len(allArticles))
	return allArticles, nil
}

func fetchArticleImage(client *http.Client, targetURL string) string {
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return ""
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			fmt.Printf("[Page Fetch Failed] %s -> Status: %d\n", targetURL, resp.StatusCode)
			resp.Body.Close()
		} else {
			fmt.Printf("[Page Fetch Failed] %s -> Error: %v\n", targetURL, err)
		}
		return ""
	}
	defer resp.Body.Close()

	// Read a larger chunk to ensure we capture the body markup where featured CDN images live
	limitedReader := io.LimitReader(resp.Body, 500*1024)
	bodyBytes, err := io.ReadAll(limitedReader)
	if err != nil {
		return ""
	}
	htmlContent := string(bodyBytes)

	// 1. Try standard Open Graph meta tag
	reOg := regexp.MustCompile(`(?i)<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([^"']+)["']`)
	if matches := reOg.FindStringSubmatch(htmlContent); len(matches) > 1 {
		return matches[1]
	}
	reOgAlt := regexp.MustCompile(`(?i)<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]+property\s*=\s*["']og:image["']`)
	if matches := reOgAlt.FindStringSubmatch(htmlContent); len(matches) > 1 {
		return matches[1]
	}

	// 2. Direct Fallback: Harvest their exact CDN domain pattern from the HTML body
	reCdn := regexp.MustCompile(`https://cdn\.ygorganization\.com/[^"'\s]+\.(?:png|jpg|jpeg|webp)`)
	if matches := reCdn.FindAllString(htmlContent, -1); len(matches) > 0 {
		return matches[0] // Grabs the first matched CDN graphic (the featured article banner)
	}

	return ""
}
