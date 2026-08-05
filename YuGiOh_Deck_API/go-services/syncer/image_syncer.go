package syncer

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blob"
)

type YGOProCardCatalog struct {
	Data []YGOProCardData `json:"data"`
}

type YGOProCardData struct {
	ID int `json:"id"`
}

// SyncAllMissingCardImages scans Azure Blob inventory, queries YGOProDeck's master catalog,
// identifies missing card IDs, and streams artwork in parallel using Goroutines.
func SyncAllMissingCardImages(blobConnStr string, containerName string) (int, error) {
	client, err := azblob.NewClientFromConnectionString(blobConnStr, nil)
	if err != nil {
		return 0, fmt.Errorf("azure blob client connection failed: %w", err)
	}

	ctx := context.Background()

	// 1. Ensure the blob container exists
	_, _ = client.CreateContainer(ctx, containerName, nil)

	// 2. Scan Azure Blob inventory into a map for O(1) lookups
	fmt.Println("[Go Syncer] Scanning existing blob inventory from Azure Storage...")
	existingBlobs := make(map[string]bool)
	pager := client.NewListBlobsFlatPager(containerName, nil)
	for pager.More() {
		resp, err := pager.NextPage(ctx)
		if err != nil {
			break
		}
		for _, blobItem := range resp.Segment.BlobItems {
			if blobItem.Name != nil {
				existingBlobs[*blobItem.Name] = true
			}
		}
	}
	fmt.Printf("[Go Syncer] Inventory scan complete. Found %d existing images in container '%s'.\n", len(existingBlobs), containerName)

	// 3. Fetch master card catalog from YGOProDeck REST API
	fmt.Println("[Go Syncer] Fetching master card catalog from YGOProDeck API...")
	httpClient := &http.Client{Timeout: 30 * time.Second}
	resp, err := httpClient.Get("https://db.ygoprodeck.com/api/v7/cardinfo.php")
	if err != nil || resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("failed to fetch card catalog from YGOProDeck API")
	}
	defer resp.Body.Close()

	var catalog YGOProCardCatalog
	if err := json.NewDecoder(resp.Body).Decode(&catalog); err != nil {
		return 0, fmt.Errorf("failed to decode catalog JSON: %w", err)
	}

	// 4. Filter missing card IDs
	var missingCardIDs []string
	for _, card := range catalog.Data {
		cardIDStr := strconv.Itoa(card.ID)
		blobName := fmt.Sprintf("%s.jpg", cardIDStr)
		if !existingBlobs[blobName] {
			missingCardIDs = append(missingCardIDs, cardIDStr)
		}
	}

	fmt.Printf("[Go Syncer] Identified %d missing card images to sync.\n", len(missingCardIDs))

	if len(missingCardIDs) == 0 {
		return 0, nil
	}

	// 5. Concurrent upload execution via Goroutines
	return SyncCardImagesConcurrently(missingCardIDs, blobConnStr, containerName)
}

// SyncSingleCardImage syncs a single card image to Azure Blob Storage if it doesn't already exist.
func SyncSingleCardImage(cardID string, blobConnStr string, containerName string) error {
	client, err := azblob.NewClientFromConnectionString(blobConnStr, nil)
	if err != nil {
		return fmt.Errorf("azure blob connection failed: %w", err)
	}

	blobName := fmt.Sprintf("%s.jpg", cardID)
	ok := processCardImageUpload(client, containerName, cardID, blobName)
	if !ok {
		return fmt.Errorf("failed to upload artwork for card ID: %s", cardID)
	}

	return nil
}

// SyncCardImagesConcurrently uses a worker pool of 15 Goroutines to stream card images in parallel.
func SyncCardImagesConcurrently(cardIDs []string, blobConnStr string, containerName string) (int, error) {
	client, err := azblob.NewClientFromConnectionString(blobConnStr, nil)
	if err != nil {
		return 0, fmt.Errorf("azure blob connection failed: %w", err)
	}

	jobs := make(chan string, len(cardIDs))
	results := make(chan bool, len(cardIDs))
	var wg sync.WaitGroup

	// Spawn 15 worker Goroutines
	workerCount := 15
	for w := 1; w <= workerCount; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for cardID := range jobs {
				blobName := fmt.Sprintf("%s.jpg", cardID)
				success := processCardImageUpload(client, containerName, cardID, blobName)
				results <- success
			}
		}()
	}

	for _, id := range cardIDs {
		jobs <- id
	}
	close(jobs)

	wg.Wait()
	close(results)

	successCount := 0
	for res := range results {
		if res {
			successCount++
		}
	}

	fmt.Printf("[Go Syncer] Batch sync complete! Uploaded %d / %d images to Azure.\n", successCount, len(cardIDs))
	return successCount, nil
}

func processCardImageUpload(client *azblob.Client, container string, cardID string, blobName string) bool {
	imageURL := fmt.Sprintf("https://images.ygoprodeck.com/images/cards/%s.jpg", cardID)

	req, err := http.NewRequest("GET", imageURL, nil)
	if err != nil {
		return false
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return false
	}
	defer resp.Body.Close()

	contentType := "image/jpeg"
	_, err = client.UploadStream(
		context.Background(),
		container,
		blobName,
		resp.Body,
		&azblob.UploadStreamOptions{
			HTTPHeaders: &blob.HTTPHeaders{
				BlobContentType: &contentType,
			},
		},
	)

	return err == nil
}
