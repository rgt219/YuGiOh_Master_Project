using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using YuGiOhDeckApi.Models;
using YuGiOhDeckApi.Data;
using YuGiOhDeckApi.Services;
using YuGiOhDeckApi.Repositories;

namespace YuGiOhDeckApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaylistController : ControllerBase
    {
        private readonly IMongoDbService _mongoDbService;

        public PlaylistController(IMongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlaylistById(string id)
        {

            var playlist = await _mongoDbService.GetPlaylistByIdAsync(id);
            if (playlist == null)
            {
                return NotFound(new { message = "Playlist not found..." });
            }

            var hydratedDecks = _mongoDbService.GetDeckListsInPlaylistAsync(playlist.DeckIds);

            return Ok(new
            {
                PlaylistData = playlist,
                Decks = hydratedDecks
            });
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<DeckPlaylist>>> GetUserPlaylists(string userId)
        {
            var playlists = await _mongoDbService.GetPlaylistsByUserIdAsync(userId);
            return Ok(playlists ?? new List<DeckPlaylist>());
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlaylist([FromBody] DeckPlaylist playlist)
        {
            try
            {
                await _mongoDbService.CreatePlaylistAsync(playlist);
                return CreatedAtAction(nameof(GetPlaylistById), new { id = playlist.Id }, playlist);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PlaylistController] Error: {ex.Message}");
                return StatusCode(500, "Internal server error while creating playlist...");
            }
        }

        [HttpPut("{playlistId}/add-deck/{deckId}")]
        public async Task<IActionResult> AddDeckToPlaylist(string playlistId, string deckId)
        {
            await _mongoDbService.AddDeckToPlaylistAsync(playlistId, deckId);
            return NoContent();
        }

        [HttpDelete("{playlistId}")]
        public async Task<IActionResult> DeletePlaylistById(string playlistId)
        {
            await _mongoDbService.DeletePlaylistByIdAsync(playlistId);
            return NoContent();
        }

        [HttpDelete("title/{playlistId}")]
        public async Task<IActionResult> DeletePlaylistByTitle(string playlistTitle)
        {
            await _mongoDbService.DeletePlaylistByTitleAsync(playlistTitle);
            return NoContent();
        }
    }
}