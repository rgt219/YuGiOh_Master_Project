using Microsoft.AspNetCore.Authorization;
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

        private string? CurrentUserId => User.FindFirst("userId")?.Value;

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

            // Private playlists are only visible to their owner (the token is optional on this route).
            if (!playlist.IsPublic && (CurrentUserId == null || playlist.UserId != CurrentUserId))
            {
                return NotFound(new { message = "Playlist not found..." });
            }

            var hydratedDecks = await _mongoDbService.GetDeckListsInPlaylistAsync(playlist.DeckIds);

            return Ok(new
            {
                PlaylistData = playlist,
                Decks = hydratedDecks
            });
        }

        [Authorize]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<DeckPlaylist>>> GetUserPlaylists(string userId)
        {
            if (userId != CurrentUserId) return Forbid();
            var playlists = await _mongoDbService.GetPlaylistsByUserIdAsync(userId);
            return Ok(playlists ?? new List<DeckPlaylist>());
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePlaylist([FromBody] DeckPlaylist playlist)
        {
            playlist.UserId = CurrentUserId;
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

        [Authorize]
        [HttpPut("{playlistId}/add-deck/{deckId}")]
        public async Task<IActionResult> AddDeckToPlaylist(string playlistId, string deckId)
        {
            var existing = await _mongoDbService.GetPlaylistByIdAsync(playlistId);
            if (existing == null || existing.UserId != CurrentUserId)
                return NotFound(new { message = "Playlist not found..." });

            await _mongoDbService.AddDeckToPlaylistAsync(playlistId, deckId);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{playlistId}")]
        public async Task<IActionResult> DeletePlaylistById(string playlistId)
        {
            var existing = await _mongoDbService.GetPlaylistByIdAsync(playlistId);
            if (existing == null || existing.UserId != CurrentUserId)
                return NotFound(new { message = "Playlist not found..." });

            await _mongoDbService.DeletePlaylistByIdAsync(playlistId);
            return NoContent();
        }
    }
}