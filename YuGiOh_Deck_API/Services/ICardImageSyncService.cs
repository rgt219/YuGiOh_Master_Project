namespace YuGiOhDeckApi.Services
{
    public interface ICardImageSyncService
    {
        Task SyncMissingCardImagesAsync();
        Task SyncSingleCardImageAsync(string cardId);
    }
}
