using System.Text.Json.Serialization;

namespace MarketTelemetry.Service.Models
{

    public class TcgCsvGroupResponse
    {
        [JsonPropertyName("results")]
        public List<TcgCsvGroup>? Results { get; set; }
    }

    public class TcgCsvGroup
    {
        [JsonPropertyName("groupId")]
        public int GroupId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("abbreviation")]
        public string? Abbreviation { get; set; }
    }

    public class TcgCsvProductResponse
    {
        [JsonPropertyName("results")]
        public List<TcgCsvProduct>? Results { get; set; }
    }

    public class TcgCsvProduct
    {
        [JsonPropertyName("productId")]
        public int ProductId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("cleanName")]
        public string? CleanName { get; set; }

        [JsonPropertyName("groupId")]
        public int GroupId { get; set; }

        [JsonPropertyName("extendedData")]
        public List<TcgCsvExtendedData>? ExtendedData { get; set; }
    }

    public class TcgCsvExtendedData
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;
    }

    // --- 3. PRICES ---
    public class TcgCsvPriceResponse
    {
        [JsonPropertyName("results")]
        public List<TcgCsvPrice>? Results { get; set; }
    }

    public class TcgCsvPrice
    {
        [JsonPropertyName("productId")]
        public int ProductId { get; set; }

        [JsonPropertyName("lowPrice")]
        public decimal? LowPrice { get; set; }

        [JsonPropertyName("midPrice")]
        public decimal? MidPrice { get; set; }

        [JsonPropertyName("highPrice")]
        public decimal? HighPrice { get; set; }

        [JsonPropertyName("marketPrice")]
        public decimal? MarketPrice { get; set; }

        [JsonPropertyName("directLowPrice")]
        public decimal? DirectLowPrice { get; set; }

        [JsonPropertyName("subTypeName")]
        public string? SubTypeName { get; set; }
    }
}