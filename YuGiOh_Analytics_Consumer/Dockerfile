# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["YuGiOh_Analytics_Consumer.csproj", "./"]
RUN dotnet restore "YuGiOh_Analytics_Consumer.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "YuGiOh_Analytics_Consumer.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# The worker service doesn't listen on a port, so no EXPOSE is needed
ENTRYPOINT ["dotnet", "YuGiOh_Analytics_Consumer.dll"]