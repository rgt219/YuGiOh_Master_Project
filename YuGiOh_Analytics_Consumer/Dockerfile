# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copy the project file using the full path from the root
COPY ["YuGiOh_Analytics_Consumer/YuGiOh_Analytics_Consumer.csproj", "YuGiOh_Analytics_Consumer/"]

# 2. Restore dependencies
RUN dotnet restore "YuGiOh_Analytics_Consumer/YuGiOh_Analytics_Consumer.csproj"

# 3. Copy the source code
COPY YuGiOh_Analytics_Consumer/ YuGiOh_Analytics_Consumer/

# 4. Build and publish
WORKDIR "/src/YuGiOh_Analytics_Consumer"
RUN dotnet publish "YuGiOh_Analytics_Consumer.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "YuGiOh_Analytics_Consumer.dll"]