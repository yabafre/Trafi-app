# syntax=docker/dockerfile:1

# ============================================
# Trafi Dashboard - Multi-Stage Dockerfile
# ============================================
# This Dockerfile builds the Next.js Dashboard application.
#
# Stages:
#   - base: Shared Node.js 20 Alpine with pnpm
#   - development: Hot-reload development server with Turbopack
#   - builder: Build production artifacts
#   - production: Optimized standalone production image
#
# Usage:
#   Development: docker build --target development -t trafi-dashboard:dev .
#   Production:  docker build --target production -t trafi-dashboard:prod .
# ============================================

# ============================================
# Base Stage - Shared Dependencies
# ============================================
FROM node:20-alpine AS base

# Install essential tools
RUN apk add --no-cache libc6-compat

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
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/@trafi/types/package.json ./packages/@trafi/types/
COPY packages/@trafi/validators/package.json ./packages/@trafi/validators/
COPY packages/@trafi/config/package.json ./packages/@trafi/config/

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy shared packages source code
COPY packages/ ./packages/

# Copy Dashboard source code
COPY apps/dashboard/ ./apps/dashboard/

# Expose Dashboard port
EXPOSE 3000

# Start development server with Turbopack for fast refresh
CMD ["pnpm", "--filter", "@trafi/dashboard", "dev"]

# ============================================
# Builder Stage - Production Build
# ============================================
FROM base AS builder

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json files for all workspaces
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/@trafi/types/package.json ./packages/@trafi/types/
COPY packages/@trafi/validators/package.json ./packages/@trafi/validators/
COPY packages/@trafi/config/package.json ./packages/@trafi/config/

# Install all dependencies for building
RUN pnpm install --frozen-lockfile

# Copy shared packages source code
COPY packages/ ./packages/

# Copy Dashboard source code
COPY apps/dashboard/ ./apps/dashboard/

# Build Next.js with standalone output
WORKDIR /app/apps/dashboard
RUN pnpm build

WORKDIR /app

# ============================================
# Production Stage - Optimized Runtime
# ============================================
FROM node:20-alpine AS production

# Install essential tools (curl needed for health checks)
RUN apk add --no-cache libc6-compat curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Memory limit for Node.js process
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy built application from builder stage
# Next.js standalone output includes everything needed
COPY --from=builder /app/apps/dashboard/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./.next/static

USER nextjs

# Expose Dashboard port
EXPOSE 3000

# Health check - verify Next.js server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start production server
CMD ["node", "apps/dashboard/server.js"]
