namespace YuGiOhDeckApi.Services
{
    public interface ICardImageSyncService
    {
        Task SyncMissingCardImagesAsync();
        Task SyncSingleCardImageAsync(string cardId);
        Task SyncMissingCardImagesAsync(List<string> cardIds);
    }
}
