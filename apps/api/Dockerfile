FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build --filter=@castlyo/api

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod", "--filter=@castlyo/api"]
