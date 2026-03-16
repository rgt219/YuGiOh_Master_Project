using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Cryptography.X509Certificates;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeckListController : ControllerBase
    {
        /* =======================================
         * =========== ENTITY LOGIC =============
         ========================================*/
        public readonly IDeckListRepository _deckListRepository;

        public DeckListController(IDeckListRepository deckListRepository)
        {
            _deckListRepository = deckListRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeckList>>> GetAllAsync()
        {
            var allDeckLists = await _deckListRepository.GetAllAsync();
            return Ok(allDeckLists);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DeckList>> GetDeckListById(int id)
        {
            var deckList = await _deckListRepository.GetByIdAsync(id);

            if (deckList == null) return NotFound();

            return Ok(deckList);
        }

        [HttpPost]
        public async Task<ActionResult<DeckList>> CreateDeckList(DeckList deckList)
        {
            await _deckListRepository.AddDeckListAsync(deckList);
            return CreatedAtAction(nameof(GetDeckListById), new { id = deckList.Id }, deckList);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDeckListById(int id)
        {
            await _deckListRepository.DeleteDeckListAsync(id);
            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DeckList>> UpdateDeckListAsync(int id, DeckList deckList)
        {
            // if (id != deckList.Id)
            // {
            //     return BadRequest();
            // }

            await _deckListRepository.UpdateDeckListAsync(deckList);

            return CreatedAtAction(nameof(GetDeckListById), new { id = deckList.Id }, deckList);
        }
    }
}
