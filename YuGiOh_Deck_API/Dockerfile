# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copy the Solution AND the Project file
# (Adjust paths if your .csproj is inside a subfolder like 'YuGiOh_Deck_API/YuGiOhDeckApi.csproj')
COPY ["YuGiOhDeckApi.sln", "./"]
COPY ["YuGiOhDeckApi.csproj", "./"]

# 2. Restore specifically for this project
RUN dotnet restore "YuGiOhDeckApi.csproj"

# 3. Copy everything else in the current folder
COPY . .

# 4. Publish the specific project, NOT the whole solution
RUN dotnet publish "YuGiOhDeckApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "YuGiOhDeckApi.dll"]