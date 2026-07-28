using YuGiOhDeckApi.Models;

namespace YuGiOhDeckApi.Services
{
    public interface IMetaDeckScraperService
    {
        Task<List<MetaDeck>> ScrapeTcgMetaDecksAsync();
    }
}