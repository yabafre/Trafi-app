-- Enable citext extension for case-insensitive text fields
-- This extension is required BEFORE using @db.Citext in Prisma schema
-- @see Story M-1 - V3 Architectural Retroactive Fixes (AC1)
-- @see Principle #8 - Case-Insensitive Fields (citext)

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

-- Alter users.email column to use citext for case-insensitive comparison
-- This allows "John@Email.COM" == "john@email.com" for login
ALTER TABLE "users" ALTER COLUMN "email" TYPE citext;
