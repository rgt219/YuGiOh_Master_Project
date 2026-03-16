const isLocal = window.location.hostname === "localhost";

export const API_URLS = {
    IDENTITY: isLocal 
        ? "https://localhost:5001/api/users" 
        : "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Users",
    DECK: isLocal 
        ? "https://localhost:5002/api/decks" 
        : "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb"
};