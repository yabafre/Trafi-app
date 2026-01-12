/**
 * E2E Test Environment Setup
 *
 * Sets required environment variables before tests run.
 * This file is loaded via setupFiles in jest-e2e.json
 *
 * IMPORTANT: DATABASE_URL must be set in your environment or .env file
 * The e2e tests require a running PostgreSQL database.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');
const path = require('path');

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// JWT configuration for auth tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-required';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-minimum-32-characters-req';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
process.env.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// Node environment
process.env.NODE_ENV = 'test';
