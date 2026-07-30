using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;

namespace YuGiOhDeckApi.Services
{
    public class CardImageSyncService : ICardImageSyncService
    {
        private readonly BlobContainerClient _containerClient;
        private readonly HttpClient _httpClient;
        private readonly ILogger<CardImageSyncService> _logger;

        public CardImageSyncService(
            BlobServiceClient blobServiceClient,
            HttpClient httpClient,
            ILogger<CardImageSyncService> logger)
        {
            // Connect to your 'card-images' blob container
            _containerClient = blobServiceClient.GetBlobContainerClient("card-images");
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task SyncMissingCardImagesAsync()
        {
            try
            {
                _logger.LogInformation("Starting Azure Blob card image sync...");
                await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

                // 1. Fetch all existing blob filenames into a HashSet for O(1) lookups
                var existingBlobs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                await foreach (var blobItem in _containerClient.GetBlobsAsync())
                {
                    existingBlobs.Add(blobItem.Name);
                }

                _logger.LogInformation("Found {Count} existing card images in Azure Blob Storage.", existingBlobs.Count);

                // 2. Fetch master card catalog from YGOProDeck
                var ygoResponse = await _httpClient.GetFromJsonAsync<YGOProCardCatalog>("https://db.ygoprodeck.com/api/v7/cardinfo.php");
                if (ygoResponse?.Data == null) return;

                // 3. Identify missing card IDs
                var missingCards = ygoResponse.Data
                    .Select(c => c.Id.ToString())
                    .Where(id => !existingBlobs.Contains($"{id}.jpg"))
                    .Distinct()
                    .ToList();

                _logger.LogInformation("Found {Count} new/missing card images to sync.", missingCards.Count);

                // 4. Download and upload missing images with rate-limiting pauses
                int uploadedCount = 0;
                foreach (var cardId in missingCards)
                {
                    await UploadCardToBlobAsync(cardId);
                    uploadedCount++;

                    // Polite 100ms throttle delay to respect YGOProDeck CDN limits
                    await Task.Delay(100);
                }

                _logger.LogInformation("Card image sync complete! Successfully uploaded {Count} new cards.", uploadedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during Azure Blob card image sync.");
            }
        }

        public async Task SyncSingleCardImageAsync(string cardId)
        {
            string blobName = $"{cardId}.jpg";
            var blobClient = _containerClient.GetBlobClient(blobName);

            if (!await blobClient.ExistsAsync())
            {
                await UploadCardToBlobAsync(cardId);
            }
        }

        private async Task UploadCardToBlobAsync(string cardId)
        {
            try
            {
                string imageUrl = $"https://images.ygoprodeck.com/images/cards/{cardId}.jpg";
                using var imageStream = await _httpClient.GetStreamAsync(imageUrl);

                string blobName = $"{cardId}.jpg";
                var blobClient = _containerClient.GetBlobClient(blobName);

                await blobClient.UploadAsync(imageStream, new BlobHttpHeaders
                {
                    ContentType = "image/jpeg"
                });

                _logger.LogInformation("Uploaded missing card image: {BlobName}", blobName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to upload image for card ID: {CardId}", cardId);
            }
        }

        private class YGOProCardCatalog { public List<YGOProCardData>? Data { get; set; } }
        private class YGOProCardData { public int Id { get; set; } }
    }
}