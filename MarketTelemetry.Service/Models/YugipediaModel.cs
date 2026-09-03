using System.Text.Json.Serialization;

namespace MarketTelemetry.Service.Models
{
    public class YugipediaResponse
    {
        [JsonPropertyName("query")]
        public YugipediaQuery? Query { get; set; }
    }

    public class YugipediaQuery
    {
        [JsonPropertyName("pages")]
        public Dictionary<string, YugipediaPage>? Pages { get; set; }
    }

    public class YugipediaPage
    {
        [JsonPropertyName("thumbnail")]
        public YugipediaThumbnail? Thumbnail { get; set; }
    }

    public class YugipediaThumbnail
    {
        [JsonPropertyName("source")]
        public string Source { get; set; } = string.Empty;
    }
}