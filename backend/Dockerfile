FROM node:20-alpine AS development-dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS production-dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=development-dependencies /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Install curl for healthcheck
RUN apk --no-cache add curl

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD curl -f http://localhost:4000/health || exit 1

# Use non-root user for security
USER node

CMD ["npm", "run", "start"]
