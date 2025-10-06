# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/database/package*.json ./packages/database/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build API
RUN npm run build --workspace=@castlyo/api

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
    