# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Environment variables (default values, can be overridden in Cloud Run)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Run the app
CMD ["npm", "start"]
