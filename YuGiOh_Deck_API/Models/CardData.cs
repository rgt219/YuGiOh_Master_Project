using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

public class CardData
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("level")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int? Level { get; set; }

    [JsonPropertyName("atk")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int? Atk { get; set; }

    [JsonPropertyName("def")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int? Def { get; set; }

    [JsonPropertyName("race")]
    public string Race { get; set; } = string.Empty;

    [JsonPropertyName("attribute")]
    public string Attribute { get; set; } = string.Empty;

    // We keep this for internal serialization if needed, but prioritize the flat property
    [JsonPropertyName("card_images")]
    public List<CardImage> CardImages { get; set; } = new();

    // FIX: Added 'set' so MongoDbService can assign the URL directly
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;
}

public class CardImage
{
    [JsonPropertyName("image_url_small")]
    public string ImageUrlSmall { get; set; } = string.Empty;
}

public class HydratedDeckResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    // Ensure these use the updated CardData model
    public List<CardData> MainDeck { get; set; } = new();
    public List<CardData> ExtraDeck { get; set; } = new();
    public List<CardData> SideDeck { get; set; } = new();
}