# 1. Use the SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 2. Copy .csproj files using the exact folder names from your sidebar
COPY ["YuGiOh_Deck_API/YuGiOhDeckApi.csproj", "YuGiOh_Deck_API/"]
COPY ["YuGiOh_Analytics_Consumer/YuGiOh_Analytics_Consumer.csproj", "YuGiOh_Analytics_Consumer/"]

# 3. Restore based on the API project path
RUN dotnet restore "YuGiOh_Deck_API/YuGiOhDeckApi.csproj"

# ... (Steps 1-3: SDK Setup, Copying csproj, and Restore)

# 4. Copy the actual source code
COPY YuGiOh_Deck_API/ YuGiOh_Deck_API/
COPY YuGiOh_Analytics_Consumer/ YuGiOh_Analytics_Consumer/

# --- NEW FIX: Manually delete the conflicting file ---
RUN rm /src/YuGiOh_Analytics_Consumer/appsettings.json

# 5. Build and Publish the API
WORKDIR "/src/YuGiOh_Deck_API"
RUN dotnet publish "YuGiOhDeckApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ... (Step 6: Final Runtime Image)

# 6. Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "YuGiOhDeckApi.dll"]