# Stage 1: Build the Next.js App
FROM node:20-alpine AS build
WORKDIR /app

# Define ARGs for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js (Next.js Standalone Mode)
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Next.js defaults to port 3000, but we can override it to 80 to match your Azure ingress
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# Copy the standalone build from Stage 1
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 80

# Start the standalone Node server
CMD ["node", "server.js"]