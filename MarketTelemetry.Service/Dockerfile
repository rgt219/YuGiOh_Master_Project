# Build Stage (Updated to .NET 9.0)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore dependencies
COPY ["MarketTelemetry.Service/MarketTelemetry.Service.csproj", "MarketTelemetry.Service/"]
RUN dotnet restore "MarketTelemetry.Service/MarketTelemetry.Service.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/MarketTelemetry.Service"
RUN dotnet build "MarketTelemetry.Service.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "MarketTelemetry.Service.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Run Stage (Updated to .NET 9.0 aspnet runtime)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MarketTelemetry.Service.dll"]