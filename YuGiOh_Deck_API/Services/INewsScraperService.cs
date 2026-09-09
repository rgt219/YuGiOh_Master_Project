using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public interface INewsScraperService
    {
        Task<List<NewsArticle>> ScrapeNewsAsync();
    }
}