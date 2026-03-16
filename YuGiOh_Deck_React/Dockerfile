# Stage 1: Build the React App
FROM node:20-alpine AS build
WORKDIR /app

# 1. Define ARGs for the URLs
ARG REACT_APP_IDENTITY_URL
ARG REACT_APP_DECK_API_URL

# 2. Assign to ENV so the build process sees them
ENV REACT_APP_IDENTITY_URL=$REACT_APP_IDENTITY_URL
ENV REACT_APP_DECK_API_URL=$REACT_APP_DECK_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# 3. Clean out the default Nginx files
RUN rm -rf ./*

# 4. Copy the build output from Stage 1
COPY --from=build /app/build .

# 5. Copy your custom Nginx configuration
# This replaces the default config with your Cache-Control settings
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]