using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Services;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BanListController : ControllerBase
    {
        private readonly IMasterDuelBanListService _banListService;
        public BanListController(IMasterDuelBanListService banListService)
        {
            _banListService = banListService;
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