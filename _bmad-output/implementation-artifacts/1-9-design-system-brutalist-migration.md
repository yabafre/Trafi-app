# Story 1.9: Design System Migration to Brutalist v2

Status: done

## Story

As a **System**,
I want **the dashboard to follow the Digital Brutalism v2 design specification**,
So that **all UI components have a consistent, intentional aesthetic aligned with the UX vision**.

## Acceptance Criteria

1. **Given** the dashboard is loaded
   **When** viewing any page
   **Then** the theme uses:
   - Pure Black (#000000) background (dark mode) / Pure White (#FFFFFF) (light mode)
   - Pure White (#FFFFFF) text (dark mode) / Pure Black (#000000) (light mode)
   - Acid Lime (#CCFF00) for primary actions
   - Success Green (#00FF94) for success states
   - Risk Red (#FF3366) for destructive/error states
   - Border (#333333 dark / #E5E5E5 light) for all borders

2. **Given** any UI component (Button, Card, Input, etc.)
   **When** rendered
   **Then** it has `border-radius: 0px` (no rounded corners)

3. **Given** text content
   **When** displayed
   **Then** headings use Space Grotesk font and data/numbers use JetBrains Mono

4. **Given** interactive elements
   **When** hovered
   **Then** they follow the "invert" hover pattern (white bg, black text on hover)

5. **Given** borders and separators
   **When** rendered
   **Then** they are visible 1px solid border (not subtle/faded)

## Tasks / Subtasks

- [x] **Task 1: Install Space Grotesk Font** (AC: #3)
  - [x] 1.1 Add Space Grotesk from Google Fonts
  - [x] 1.2 Update layout.tsx to use Space Grotesk instead of General Sans

- [x] **Task 2: Update CSS Variables for Brutalist Theme** (AC: #1, #2, #5)
  - [x] 2.1 Update globals.css with pure black/white colors (light + dark mode)
  - [x] 2.2 Set --radius to 0px
  - [x] 2.3 Update border color (theme-aware)
  - [x] 2.4 Add Acid Lime (#CCFF00) as primary/accent color
  - [x] 2.5 Update success (#00FF94) and destructive (#FF3366) colors

- [x] **Task 3: Update Shadcn UI Components** (AC: #2, #4)
  - [x] 3.1 Update Button component with radius-0 and hover-invert
  - [x] 3.2 Update Card component with radius-0 and visible borders
  - [x] 3.3 Update Input component with radius-0 and visible borders
  - [x] 3.4 Update Label component styling

- [x] **Task 4: Update Login Page Styling** (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Update LoginForm with Brutalist styling
  - [x] 4.2 Update auth layout with corner accents

- [x] **Task 5: Update Dashboard Layout** (AC: #1, #2, #5)
  - [x] 5.1 Update header with Brutalist styling
  - [x] 5.2 Ensure visible grid/border structure

- [x] **Task 6: Verify All Pages** (AC: all)
  - [x] 6.1 Run typecheck (passed)
  - [x] 6.2 Visual verification of Brutalist theme

## Dev Notes

### UX Design Reference

Based on `_bmad-output/planning-artifacts/ux-design-vison.tsx` and `ux-design-specification.md`:

**Color Palette:**
```css
--background: #000000 (Pure Black)
--foreground: #FFFFFF (Pure White)
--primary: #CCFF00 (Acid Lime)
--success: #00FF94 (Neon Green)
--destructive: #FF3366 (Vivid Red)
--border: #333333 (Dark Gray)
--muted: #111111 (Near Black)
--muted-foreground: #666666 (Gray)
```

**Typography:**
- Headings: Space Grotesk (bold, uppercase)
- Body: Space Grotesk
- Data/Numbers: JetBrains Mono

**Interactions:**
- Hover: Invert (white bg, black text)
- Accent hover: Acid lime bg (#CCFF00)
- No shadows, no gradients
- Transitions: instant (duration-100 or duration-0)

### Shadcn Component Patterns

Components remain Shadcn-based but with Brutalist overrides:
- All rounded-* classes become rounded-none
- All borders become visible (border-[#333])
- Hover states invert colors

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. **Light + Dark Mode Support**: User requested both light and dark mode support instead of dark-only. Updated globals.css with proper :root (light) and .dark mode variables that use theme-aware CSS variables.

2. **Theme-Aware Utility Classes**: Updated brutalist utility classes (.brutal-border, .hover-invert, .hover-accent) to use CSS variables instead of hardcoded colors, enabling proper theming for both modes.

3. **Button Variants**: Added new "collective" variant (acid lime background) to Button component following the UX vision patterns. Updated all variants with proper hover-invert behavior.

4. **Typography**: Labels now use uppercase + tracking-widest + font-bold for the Brutalist feel. CardDescription uses font-mono for data representation.

5. **System Theme**: ThemeProvider now defaults to "system" with enableSystem=true, allowing users to use their OS preference.

### File List

**Modified Files (Dashboard - Core):**
- `apps/dashboard/src/app/layout.tsx` - Updated fonts (Space Grotesk + JetBrains Mono), enabled system theme
- `apps/dashboard/src/app/globals.css` - Complete Brutalist theme with light + dark mode variables, utility classes

**Modified Files (Dashboard - UI Components):**
- `apps/dashboard/src/components/ui/button.tsx` - Brutalist styling with invert hover, new "collective" variant
- `apps/dashboard/src/components/ui/card.tsx` - Removed rounded corners and shadows, uppercase titles
- `apps/dashboard/src/components/ui/input.tsx` - Removed rounded corners, added font-mono
- `apps/dashboard/src/components/ui/label.tsx` - Uppercase, bold, tracking-widest styling

**Modified Files (Dashboard - Pages):**
- `apps/dashboard/src/app/(auth)/layout.tsx` - Added corner accent squares
- `apps/dashboard/src/app/(auth)/login/page.tsx` - Brutalist logo and typography
- `apps/dashboard/src/app/(auth)/login/_components/LoginForm.tsx` - Updated Card padding and borders
- `apps/dashboard/src/app/(dashboard)/layout.tsx` - Brutalist header with logo and user info

