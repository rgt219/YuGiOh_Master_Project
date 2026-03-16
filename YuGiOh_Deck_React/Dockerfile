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

# 3. Copy the build output from Stage 1
COPY --from=build /app/build .

# 4. Inject the Cache-Control header into the Nginx config
# This tells the browser: "Always check if index.html has changed"
RUN sed -i '/index.html;/a \        add_header Cache-Control "no-store, no-cache, must-revalidate";' /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]