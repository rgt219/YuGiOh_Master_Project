# Stage 1: Build the Next.js App
FROM node:20-alpine AS build
WORKDIR /app

# 1. Define ARGs for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Clean out default Nginx files
RUN rm -rf ./*

# ⚡ Copy the static Next.js output from Stage 1 (/app/out instead of /app/build)
COPY --from=build /app/out .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]