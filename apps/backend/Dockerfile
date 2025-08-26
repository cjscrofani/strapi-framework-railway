# Use the official Node.js 20 image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development image
FROM base AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 1337
ENV NODE_ENV=development
CMD ["npm", "run", "develop"]

# Build image
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV STRAPI_DISABLE_UPDATE_NOTIFICATION=true
ENV STRAPI_TELEMETRY_DISABLED=true

# Create strapi user
RUN addgroup --system --gid 1001 strapi
RUN adduser --system --uid 1001 strapi

# Copy built application
COPY --from=builder --chown=strapi:strapi /app/dist ./dist
COPY --from=builder --chown=strapi:strapi /app/config ./config
COPY --from=builder --chown=strapi:strapi /app/database ./database
COPY --from=builder --chown=strapi:strapi /app/public ./public
COPY --from=deps --chown=strapi:strapi /app/node_modules ./node_modules
COPY --chown=strapi:strapi package*.json ./

USER strapi

EXPOSE 1337

CMD ["npm", "run", "start"]