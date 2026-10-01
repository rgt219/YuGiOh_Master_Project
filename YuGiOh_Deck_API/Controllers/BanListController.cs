using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BanListController : ControllerBase
    {
        private readonly IMasterDuelBanListService _banListService;
        private readonly IMongoDbService _db;

        public BanListController(IMasterDuelBanListService banListService, IMongoDbService db)
        {
            _banListService = banListService;
            _db = db;
        }

        // Master Duel, TCG and OCG ban lists, each card with its YGOPRODeck id. Used by the ban list page.
        [HttpGet("cards")]
        public async Task<IActionResult> GetAllBanLists()
        {
            var lists = await _db.GetCombinedBanListsAsync();
            return Ok(lists);
        }

        [HttpGet("masterduel")]
        public async Task<IActionResult> GetMasterDuelBanList()
        {
            // ⚡ Point back to the clean MasterDuelBanList collection
            var data = await _banListService.GetMasterDuelBanListAsync();

            if (data == null || data.Cards == null || data.Cards.Count == 0)
            {
                return StatusCode(503, new { message = "Master Duel ban list is not yet populated." });
            }

            return Ok(data);
        }
    }
}