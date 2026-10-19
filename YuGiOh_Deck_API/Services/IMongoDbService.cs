using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Repositories
{
    public interface IMongoDbService
    {
        /*=========== DeckListMongoDbController | Models: DeckList, HydratedDeckResponse ===========*/
        Task<HydratedDeckResponse?> GetHydratedDeckAsync(string id);
        Task<IEnumerable<DeckList>> GetAsync();
        Task<DeckList> GetByIdAsync(string id);
        Task CreateAsync(DeckList deckList);
        Task UpdateByIdAsync(DeckList deck, string id);
        Task DeleteByIdAsync(string id);
        Task<List<DeckList>> GetByUserIdAsync(string userId);
        Task<bool> DeleteUserDeckAsync(string deckId, string userId);
        Task DeleteByTitleAsync(string title);
        Task<List<DeckList>> GetRecentDecksAsync(int limit = 5);
        Task<string> GetUsernameByUserIdAsync(string? userId);

        /*=========== AnalyticsController / AdminController | Models: MetaDeck, CardAnalytics ===========*/
        Task SaveMetaDeckAsync(MetaDeck metaDeck);
        Task<List<MetaDeck>> GetMetaDecksAsync(string? format = null);
        Task<MetaDeck?> GetMetaDeckByIdAsync(string id);
        Task<int> SaveMetaDecksBulkAsync(List<MetaDeck> metaDecks);
        Task<List<CardAnalytics>> GetTrendingCardsAsync(string format, int limit = 18);
        Task RecomputeCardAnalyticsAsync();

        /*=========== MasterDuelController / MasterDuelBanListService | Models: MasterDuelBanListResponse, MasterDuelCardDocument ===========*/
        Task<MasterDuelBanListResponse?> GetLatestMasterDuelBanListAsync();
        Task SaveMasterDuelBanListAsync(MasterDuelBanListResponse banlist);
        Task<List<MasterDuelCardDocument>> GetAllMasterDuelCardsAsync();
        Task<MasterDuelCardDocument?> GetMasterDuelCardByGameIdAsync(string gameId);
        Task<bool> SaveMasterDuelDatabaseAsync(MasterDuelDatabaseSyncResponseDto syncPayload);
        Task<List<MasterDuelCardDocument>> GetRestrictedMasterDuelCardsAsync();

        /*=========== BanListController | Models: BanListsResponse ===========*/
        Task<BanListsResponse> GetCombinedBanListsAsync();

        /*=========== CollectionController | Models: CollectionEntry ===========*/
        Task<List<CollectionEntry>> GetCollectionAsync(string userId);
        Task SetCollectionQuantityAsync(string userId, int cardId, int quantity);

        /*=========== WatchlistController | Models: PriceWatch ===========*/
        Task<List<PriceWatch>> GetWatchesAsync(string userId);
        Task AddWatchAsync(string userId, int productId, string cardName, string setName, string rarity);
        Task RemoveWatchAsync(string userId, int productId);
        Task<List<string>> GetWatcherUserIdsAsync(int productId);   // used by PriceDropNotifier, not the controller

        /*=========== News | Models: NewsArticle ===========*/
        Task<List<NewsArticle>> GetLatestNewsAsync(int limit = 20);
        Task SaveNewsArticlesBulkAsync(List<NewsArticle> articles);

        Task<DeckPlaylist> GetPlaylistByIdAsync(string id);
        Task<List<DeckPlaylist>> GetPlaylistsByUserIdAsync(string userId);
        Task CreatePlaylistAsync(DeckPlaylist playlist);
        Task AddDeckToPlaylistAsync(string playlistId, string deckId);
        Task<List<DeckList>> GetDeckListsInPlaylistAsync(List<string> deckIds);
        Task DeletePlaylistByIdAsync(string playlistId);
        Task DeletePlaylistByTitleAsync(string playlistTitle);

        /*=========== DeckNoteController | Models: DeckNote ===========*/
        Task<DeckNote?> GetDeckNoteAsync(string userId, string deckId);
        Task<List<DeckNote>> GetDeckNotesAsync(string userId);
        Task<DeckNote> SaveDeckNoteAsync(string userId, string deckId, string notes, List<string> tags);
        Task<bool> DeleteDeckNoteAsync(string userId, string deckId);
        Task DeleteDeckNotesByDeckAsync(string deckId);

        /*=========== CardCompanionsController | Models: CardCompanions ===========*/
        Task<CardCompanions?> GetCardCompanionsAsync(string cardId);
    }
}