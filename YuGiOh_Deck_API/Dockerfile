# 1. Use the SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 2. Copy BOTH project files so the restore can see the relationship
COPY ["YuGiOhDeckApi/YuGiOhDeckApi.csproj", "YuGiOhDeckApi/"]
COPY ["YuGiOh_Analytics_Consumer/YuGiOh_Analytics_Consumer.csproj", "YuGiOh_Analytics_Consumer/"]

# 3. Restore dependencies
RUN dotnet restore "YuGiOhDeckApi/YuGiOhDeckApi.csproj"

# 4. Copy the actual source code for BOTH projects
COPY YuGiOhDeckApi/ YuGiOhDeckApi/
COPY YuGiOh_Analytics_Consumer/ YuGiOh_Analytics_Consumer/

# 5. Build and Publish the API
WORKDIR "/src/YuGiOhDeckApi"
RUN dotnet publish "YuGiOhDeckApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 6. Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "YuGiOhDeckApi.dll"]