using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace YourAppName.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public AiController(IConfiguration config, HttpClient httpClient)
        {
            _config = config;
            _httpClient = httpClient;
        }

        public class SystemPromptRequest
        {
            public string SystemPrompt { get; set; } = string.Empty;
        }

        [HttpPost("suggest")]
        public async Task<IActionResult> Suggest([FromBody] SystemPromptRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SystemPrompt))
            {
                return BadRequest(new { error = "SystemPrompt is required." });
            }

            // Reads key from environment variable set in Azure Container App
            var apiKey = _config["GEMINI_API_KEY"];
            if (string.IsNullOrEmpty(apiKey))
            {
                return StatusCode(500, new { error = "GEMINI_API_KEY is not configured on the backend server." });
            }

            var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={apiKey}";

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = request.SystemPrompt } } }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(geminiUrl, jsonContent);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { error = "Gemini API call failed", details = responseBody });
                }

                // Return raw JSON response back to React frontend
                return Content(responseBody, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error proxying AI request.", message = ex.Message });
            }
        }
    }
}