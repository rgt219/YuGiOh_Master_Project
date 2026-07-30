using Microsoft.AspNetCore.Mvc;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace YuGiOhDeckApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetaDecksController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        private readonly ILogger<MetaDecksController> _logger;

        public MetaDecksController(MongoDbService mongoDbService, ILogger<MetaDecksController> logger)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
        }

        // [HttpGet]
        // public async Task<ActionResult<List<MetaDeck>>> GetMetaDecks()
        // {
        //     var metaDecks = await _mongoDbService.GetMetaDecksAsync();
        //     return Ok(metaDecks);
        // }


        [HttpGet("{id}")]
        public async Task<ActionResult<MetaDeck>> GetMetaDeckById(string id)
        {
            try
            {
                _logger.LogInformation("Fetching meta deck profile for ID: {Id}", id);

                var deck = await _mongoDbService.GetMetaDeckByIdAsync(id);

                if (deck == null)
                {
                    return NotFound(new { message = $"Meta deck with ID '{id}' was not found." });
                }

                return Ok(deck);
            }
            catch (Exception ex)
            {
                // Logs exact error details in terminal/Docker console instead of dropping the connection
                _logger.LogError(ex, "Exception thrown while fetching meta deck ID: {Id}", id);
                return StatusCode(500, new { message = "An internal error occurred.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<MetaDeck>>> GetMetaDecks([FromQuery] string? format = null)
        {
            try
            {
                var metaDecks = await _mongoDbService.GetMetaDecksAsync(format);
                return Ok(metaDecks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving meta decks for format: {Format}", format);
                return StatusCode(500, new { message = "An error occurred while fetching meta decks.", error = ex.Message });
            }
        }
    }
}