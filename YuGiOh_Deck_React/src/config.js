const isLocal = window.location.hostname === "localhost";

export const API_URLS = {
    IDENTITY: "https://identity.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Users",
    DECK: "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb",
    ANALYTICS: "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Analytics",
    FORUMS: "https://forum-api.happybush-e43d89b2.eastus.azurecontainerapps.io" //
};