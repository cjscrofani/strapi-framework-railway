# Multi-stage Dockerfile for Strapi Railway Framework
# Optimized for Railway deployment with health checks and monitoring

# Base image with system dependencies
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    curl \
    tini

# Build stage
FROM base AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --prefer-offline --no-audit --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
    npm run build:admin && \
    rm -rf node_modules/.cache

# Production dependencies stage
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --prefer-offline --no-audit --omit=dev && \
    npm cache clean --force

# Development image
FROM base AS dev
WORKDIR /app

# Copy package files and install dev dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads/thumbnails && \
    mkdir -p database/backups && \
    mkdir -p logs

EXPOSE 1337
ENV NODE_ENV=development
CMD ["npm", "run", "develop"]

# Production image
FROM base AS production

WORKDIR /app

# Environment variables for production
ENV NODE_ENV=production
ENV STRAPI_DISABLE_UPDATE_NOTIFICATION=true
ENV STRAPI_TELEMETRY_DISABLED=true
ENV NPM_CONFIG_PRODUCTION=true

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001 -G nodejs

# Copy production dependencies
COPY --from=deps --chown=strapi:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=strapi:nodejs /app/build ./build/
COPY --from=builder --chown=strapi:nodejs /app/dist ./dist/
COPY --from=builder --chown=strapi:nodejs /app/public ./public/
COPY --from=builder --chown=strapi:nodejs /app/config ./config/
COPY --from=builder --chown=strapi:nodejs /app/database ./database/
COPY --from=builder --chown=strapi:nodejs /app/src ./src/

# Copy other necessary files
COPY --chown=strapi:nodejs package*.json ./
COPY --chown=strapi:nodejs tsconfig.json* ./
COPY --chown=strapi:nodejs strapi.config.js* ./

# Create necessary directories with proper permissions
RUN mkdir -p public/uploads/thumbnails && \
    mkdir -p database/backups && \
    mkdir -p logs && \
    mkdir -p temp && \
    chown -R strapi:nodejs public && \
    chown -R strapi:nodejs database && \
    chown -R strapi:nodejs logs && \
    chown -R strapi:nodejs temp && \
    chmod -R 755 public && \
    chmod -R 755 database && \
    chmod -R 755 logs && \
    chmod -R 755 temp

# Switch to non-root user for security
USER strapi

# Expose application port
EXPOSE 1337

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:1337/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "run", "start"]