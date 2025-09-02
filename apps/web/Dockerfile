FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ui/package*.json ./packages/ui/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build --filter=@castlyo/web

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start", "--filter=@castlyo/web"]
