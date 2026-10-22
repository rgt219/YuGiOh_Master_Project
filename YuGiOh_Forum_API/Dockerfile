# Build Stage - Change sdk:8.0 to sdk:9.0
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Built from the repo root (it needs Shared/): docker build -f YuGiOh_Forum_API/Dockerfile .
COPY ["YuGiOh_Forum_API/YuGiOh_Forum_API.csproj", "YuGiOh_Forum_API/"]
COPY ["Shared/YuGiOh.ServiceDefaults/YuGiOh.ServiceDefaults.csproj", "Shared/YuGiOh.ServiceDefaults/"]
RUN dotnet restore "YuGiOh_Forum_API/YuGiOh_Forum_API.csproj"
COPY YuGiOh_Forum_API/ YuGiOh_Forum_API/
COPY Shared/YuGiOh.ServiceDefaults/ Shared/YuGiOh.ServiceDefaults/
WORKDIR "/src/YuGiOh_Forum_API"
RUN dotnet publish "YuGiOh_Forum_API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage - Change aspnet:8.0 to aspnet:9.0
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "YuGiOh_Forum_API.dll"]