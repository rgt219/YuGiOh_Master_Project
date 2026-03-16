# Stage 1: Build the React App
FROM node:20-alpine AS build

# 2. Define the ARGs (these receive values from the --build-arg flags)
ARG REACT_APP_IDENTITY_URL
ARG REACT_APP_DECK_API_URL

# 3. Set the ENVs (this makes them available to the 'npm run build' process)
ENV REACT_APP_IDENTITY_URL=$REACT_APP_IDENTITY_URL
ENV REACT_APP_DECK_API_URL=$REACT_APP_DECK_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the static files
FROM nginx:alpine AS final
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
