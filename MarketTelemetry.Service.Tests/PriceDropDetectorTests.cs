using MarketTelemetry.Service.Events;
using MarketTelemetry.Service.Models;
using Xunit;

public class PriceDropDetectorTests
{
    private static readonly DateTime Today = new(2026, 10, 6, 0, 0, 0, DateTimeKind.Utc);

    private static MarketSnapshot Snap(decimal? marketPrice, int productId = 123456) => new()
    {
        ProductId = productId,
        CardName = "Ash Blossom & Joyous Spring",
        SetName = "Maximum Crisis",
        Rarity = "Ultra Rare",
        MarketPrice = marketPrice
    };

    [Fact]
    public void Detect_ReportsARealDrop_WithTheDetailsTheNotificationNeeds()
    {
        var result = PriceDropDetector.Detect(Snap(15.00m), Snap(12.40m), Today);

        Assert.NotNull(result);
        Assert.Equal(123456, result!.ProductId);
        Assert.Equal(15.00m, result.OldPrice);
        Assert.Equal(12.40m, result.NewPrice);
        Assert.Equal("Ash Blossom & Joyous Spring", result.CardName);
        Assert.Equal("Maximum Crisis", result.SetName);
        Assert.Equal("Ultra Rare", result.Rarity);
        Assert.Equal("price-drop:123456:2026-10-06", result.EventId);
    }

    // Prices in attributes must be double (C# does not allow decimal there), so each test converts.
    [Theory]
    [InlineData(15.00, 15.00)]   // unchanged
    [InlineData(15.00, 16.00)]   // went UP
    [InlineData(15.00, 14.90)]   // 10 cents: under the minimum amount
    [InlineData(100.00, 96.00)]  // $4 but only 4%: under the minimum percent
    public void Detect_StaysQuiet_WhenTheChangeIsNotWorthAnAlert(double oldPrice, double newPrice)
    {
        var result = PriceDropDetector.Detect(Snap((decimal)oldPrice), Snap((decimal)newPrice), Today);

        Assert.Null(result);
    }

    [Theory]
    [InlineData(5.00, 4.75)]     // exactly 25 cents AND exactly 5%: the thresholds count as "enough"
    [InlineData(10.00, 9.50)]    // 50 cents and 5%
    public void Detect_TreatsTheThresholdsAsInclusive(double oldPrice, double newPrice)
    {
        var result = PriceDropDetector.Detect(Snap((decimal)oldPrice), Snap((decimal)newPrice), Today);

        Assert.NotNull(result);
    }

    [Fact]
    public void Detect_StaysQuiet_WhenThereIsNoPreviousSnapshot()
    {
        Assert.Null(PriceDropDetector.Detect(null, Snap(12.40m), Today));
    }

    [Theory]
    [InlineData(null, 12.40)]    // yesterday had no listings
    [InlineData(15.00, null)]    // today has no listings
    [InlineData(0.00, 12.40)]    // zero means "no price", not "free"
    [InlineData(15.00, 0.00)]
    public void Detect_StaysQuiet_WhenAPriceIsMissing(double? oldPrice, double? newPrice)
    {
        var result = PriceDropDetector.Detect(
            Snap(oldPrice.HasValue ? (decimal)oldPrice.Value : null),
            Snap(newPrice.HasValue ? (decimal)newPrice.Value : null),
            Today);

        Assert.Null(result);
    }

    [Fact]
    public void EventId_IsTheSameForTheSameCardOnTheSameDay_AndDifferentOtherwise()
    {
        var first = PriceDropDetector.Detect(Snap(15.00m), Snap(12.00m), Today)!;
        var again = PriceDropDetector.Detect(Snap(15.00m), Snap(12.00m), Today.AddHours(5))!;   // same day, later
        var tomorrow = PriceDropDetector.Detect(Snap(15.00m), Snap(12.00m), Today.AddDays(1))!;
        var otherCard = PriceDropDetector.Detect(Snap(15.00m, 999), Snap(12.00m, 999), Today)!;

        Assert.Equal(first.EventId, again.EventId);      // a restart must not create a second notification
        Assert.NotEqual(first.EventId, tomorrow.EventId); // a new day is a new event
        Assert.NotEqual(first.EventId, otherCard.EventId);
    }
}