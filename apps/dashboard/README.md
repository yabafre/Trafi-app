# Trafi Dashboard

Admin interface for the Trafi commerce platform.

## Tech Stack

- **Next.js 16.x** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4.x** - Utility-first CSS
- **Shadcn UI** - Component library (New York style)
- **next-themes** - Dark mode support

## Development

```bash
# From monorepo root
pnpm dev --filter=@trafi/dashboard

# Or directly
cd apps/dashboard && pnpm dev
```

The dashboard runs on [http://localhost:3000](http://localhost:3000).

## Design System

- **Dark mode** is the default theme identity
- **General Sans** - Body text font
- **Clash Display** - Heading font
- **JetBrains Mono** - Code font

## Project Structure

```
src/
├── app/                    # App Router
│   ├── (auth)/             # Auth route group
│   ├── (dashboard)/        # Dashboard route group
│   │   ├── _components/    # LOCAL components
│   │   ├── _hooks/         # LOCAL hooks
│   │   └── _actions/       # LOCAL server actions
│   ├── globals.css
│   └── layout.tsx
├── components/             # GLOBAL shared components
│   ├── ui/                 # Shadcn UI
│   └── shared/             # Custom shared
├── lib/
│   ├── utils.ts            # Utility functions
│   └── hooks/              # GLOBAL hooks
└── stores/                 # Zustand stores (UI state only)
```

## Convention

- `_` prefix = Route-local (not shared)
- No prefix = Global/Shared
