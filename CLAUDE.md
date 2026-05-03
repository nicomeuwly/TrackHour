# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # Run ESLint
npm run test      # Run all tests with Vitest
npx vitest run src/lib/business/calculations.test.ts  # Run a single test file
```

## Architecture

TrackHour is a **local-first PWA** for tracking work hours. All data lives in the browser via IndexedDB (Dexie). There is no backend, no auth, and no server-side data persistence.

### Data flow

```
UI components → custom hooks → services → Dexie (IndexedDB)
                                      ↘ calculations.ts (pure business logic)
```

- **Hooks** (`src/lib/hooks/`) orchestrate state and call services
- **Services** (`src/lib/services/`) are the only layer that touches Dexie — keep DB calls here
- **Business logic** (`src/lib/business/calculations.ts`) is pure functions with no side effects — this is the only tested file

### Key data types (`src/lib/types/`)

- `Punch` — a single clock-in or clock-out event with `type: 'in' | 'out'`
- `DayEntry` — aggregated daily record with punches, worked minutes, break minutes
- `Settings` — user preferences (expected hours, break minimum, work days, theme, locale)
- `DayStatus` — `'complete' | 'incomplete' | 'missing' | 'weekend'`

### Routing & i18n

- Routes are locale-prefixed via next-intl: `/en/time-tracker`, `/fr/pointeuse-en-ligne`
- Locale config lives in `src/i18n/routing.ts`; translations in `messages/en.json` and `messages/fr.json`
- All pages use `generateStaticParams()` to pre-render both locales

### Styling

Tailwind CSS v4. Dark mode is toggled via a `.dark` class on the root element (no media query strategy). Theme is stored in `Settings`.

### Testing

Only `src/lib/business/calculations.test.ts` has unit tests. Tests run in Node environment (no DOM). When adding business logic to `calculations.ts`, add corresponding Vitest tests.
