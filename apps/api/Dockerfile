# syntax=docker/dockerfile:1

# ============================================
# Trafi API - Multi-Stage Dockerfile
# ============================================
# This Dockerfile builds the NestJS API application.
#
# Stages:
#   - base: Shared Node.js 20 Alpine with pnpm
#   - development: Hot-reload development server
#   - builder: Build production artifacts
#   - production: Optimized production image
#
# Usage:
#   Development: docker build --target development -t trafi-api:dev .
#   Production:  docker build --target production -t trafi-api:prod .
# ============================================

# ============================================
# Base Stage - Shared Dependencies
# ============================================
FROM node:20-alpine AS base

# Install essential tools
RUN apk add --no-cache libc6-compat curl

# Enable corepack for pnpm
RUN corepack enable pnpm

WORKDIR /app

# ============================================
# Development Stage
# ============================================
FROM base AS development

ENV NODE_ENV=development

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json files for all workspaces (for proper dependency resolution)
COPY apps/api/package.json ./apps/api/
COPY packages/@trafi/types/package.json ./packages/@trafi/types/
COPY packages/@trafi/validators/package.json ./packages/@trafi/validators/
COPY packages/@trafi/config/package.json ./packages/@trafi/config/

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy shared packages source code
COPY packages/ ./packages/

# Copy API source code
COPY apps/api/ ./apps/api/

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm db:generate

WORKDIR /app

# Expose API port
EXPOSE 3001

# Start development server with hot-reload
CMD ["pnpm", "--filter", "@trafi/api", "dev"]

# ============================================
# Builder Stage - Production Build
# ============================================
FROM base AS builder

ENV NODE_ENV=production

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json files for all workspaces
COPY apps/api/package.json ./apps/api/
COPY packages/@trafi/types/package.json ./packages/@trafi/types/
COPY packages/@trafi/validators/package.json ./packages/@trafi/validators/
COPY packages/@trafi/config/package.json ./packages/@trafi/config/

# Install all dependencies for building
RUN pnpm install --frozen-lockfile

# Copy shared packages source code
COPY packages/ ./packages/

# Copy API source code
COPY apps/api/ ./apps/api/

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm db:generate

# Build the API
RUN pnpm build

WORKDIR /app

# ============================================
# Production Stage - Optimized Runtime
# ============================================
FROM node:20-alpine AS production

# Install essential tools for health checks
RUN apk add --no-cache libc6-compat curl

# Enable corepack for pnpm
RUN corepack enable pnpm

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
# Memory limit for Node.js process
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy workspace configuration (minimal)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/@trafi/types/package.json ./packages/@trafi/types/
COPY packages/@trafi/validators/package.json ./packages/@trafi/validators/
COPY packages/@trafi/config/package.json ./packages/@trafi/config/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/generated ./apps/api/src/generated

# Copy shared packages (needed at runtime)
COPY --from=builder /app/packages/@trafi/types ./packages/@trafi/types
COPY --from=builder /app/packages/@trafi/validators ./packages/@trafi/validators

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start production server
CMD ["node", "apps/api/dist/main.js"]
