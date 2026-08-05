# Build Stage - Change sdk:8.0 to sdk:9.0
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["YuGiOh_Forum_API.csproj", "./"]
RUN dotnet restore "YuGiOh_Forum_API.csproj"
COPY . .
RUN dotnet publish "YuGiOh_Forum_API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage - Change aspnet:8.0 to aspnet:9.0
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "YuGiOh_Forum_API.dll"]