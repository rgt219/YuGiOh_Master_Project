# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY ["YuGiOhIdentityApi.csproj", "./"]
RUN dotnet restore "YuGiOhIdentityApi.csproj"

# Copy the rest of the code and build
COPY . .
RUN dotnet build "YuGiOhIdentityApi.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "YuGiOhIdentityApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Final Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "YuGiOhIdentityApi.dll"]