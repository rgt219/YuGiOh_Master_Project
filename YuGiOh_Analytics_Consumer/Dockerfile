# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copy the project file using the full path from the root
COPY ["YuGiOh_Analytics_Consumer/YuGiOh_Analytics_Consumer.csproj", "YuGiOh_Analytics_Consumer/"]
COPY ["Shared/YuGiOh.ServiceDefaults/YuGiOh.ServiceDefaults.csproj", "Shared/YuGiOh.ServiceDefaults/"]

# 2. Restore dependencies
RUN dotnet restore "YuGiOh_Analytics_Consumer/YuGiOh_Analytics_Consumer.csproj"

# 3. Copy the source code
COPY YuGiOh_Analytics_Consumer/ YuGiOh_Analytics_Consumer/
COPY Shared/YuGiOh.ServiceDefaults/ Shared/YuGiOh.ServiceDefaults/

# 4. Build and publish
WORKDIR "/src/YuGiOh_Analytics_Consumer"
RUN dotnet publish "YuGiOh_Analytics_Consumer.csproj" -c Release -o /app/publish

# Stage 2: Runtime. The ASP.NET Core runtime, because the worker serves its health endpoints on port 8080.
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "YuGiOh_Analytics_Consumer.dll"]