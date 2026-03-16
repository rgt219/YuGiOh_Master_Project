# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["YuGiOhDeckApi.csproj", "./"]
RUN dotnet restore "./YuGiOhDeckApi.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Create the runtime image
FROM build AS publish
RUN dotnet publish "YuGiOhDeckApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Run the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "YuGiOhDeckApi.dll"]