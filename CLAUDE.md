# Claude Code Instructions

## Monorepo Commands

**CRITICAL: All pnpm commands must be run from the project root, never from inside apps/ or packages/ directories.**

```bash
# Correct - from project root
pnpm dev
pnpm build
pnpm test
pnpm db:push
pnpm db:generate

# WRONG - do not cd into apps
cd apps/api && pnpm dev  # NEVER DO THIS
```

## Database

- Database is hosted on **Neon.com** (not Docker)
- `DATABASE_URL` is loaded from `.env` at the root
- Use `pnpm db:push` and `pnpm db:generate` from root

## Project Structure

- Monorepo managed with Turborepo + pnpm workspaces
- `apps/api` - NestJS backend
- `apps/dashboard` - Next.js frontend
- `packages/@trafi/*` - Shared packages

## Key Files

- `_bmad-output/project-context.md` - Full coding standards and patterns
- `_bmad-output/planning-artifacts/` - PRD, architecture, epics
- `_bmad-output/implementation-artifacts/` - Stories and sprint status
