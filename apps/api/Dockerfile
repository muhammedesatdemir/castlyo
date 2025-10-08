# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all package.json and lock files
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the specific workspace
RUN npm run build --workspace=@castlyo/api

# Stage 2: Create the production image
FROM node:20-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist

# Copy source migrations so that runtime can see packages/database/migrations/** including meta/_journal.json
COPY --from=builder /app/packages/database/migrations ./packages/database/migrations

# Copy and setup entrypoint script
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Use entrypoint script for migrate-on-boot
ENTRYPOINT ["./docker-entrypoint.sh"]
    