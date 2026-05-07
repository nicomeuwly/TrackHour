# TrackHour

A local-first PWA for tracking daily work hours. No account, no backend, no data sent to any server — everything lives in the browser via IndexedDB.

Live at [trackhour.app](https://trackhour.app)

## Stack

- **Next.js 16** (App Router, static export)
- **React 19**
- **Tailwind CSS v4**
- **next-intl** — EN / FR, locale-prefixed routes
- **Dexie** — IndexedDB wrapper, all data stored client-side
- **Vitest** — unit tests for pure business logic
- **Vercel** — hosting, analytics, speed insights

## Commands

```bash
npm run dev       # Dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npm run test      # Vitest (unit tests only)
```

## Architecture

```
UI components → custom hooks → services → Dexie (IndexedDB)
                                       ↘ calculations.ts (pure functions)
```

- **`src/lib/services/`** — only layer that touches Dexie directly
- **`src/lib/hooks/`** — orchestrate state, call services
- **`src/lib/business/calculations.ts`** — pure business logic, no side effects
- **`src/lib/types/`** — shared TypeScript types

### Key types

| Type | Description |
|---|---|
| `Punch` | Single clock-in or clock-out event (`type: 'in' \| 'out'`) |
| `DayEntry` | Aggregated daily record (punches, worked minutes, break minutes) |
| `Settings` | User preferences (expected hours, work days, theme, locale) |
| `DayStatus` | `'complete' \| 'incomplete' \| 'missing' \| 'weekend' \| 'vacation'` |

## Pages

| Route (EN) | Route (FR) | Description |
|---|---|---|
| `/` | `/` | Homepage |
| `/time-tracker` | `/pointeuse-en-ligne` | Daily clock-in/out tool |
| `/stats` | `/statistiques` | Weekly & monthly overview |
| `/how-to-track-work-hours` | `/comment-suivre-ses-heures-de-travail` | Work hours guide |
| `/overtime-guide` | `/guide-heures-supplementaires` | Overtime calculation guide |
| `/privacy-policy` | `/politique-de-confidentialite` | Privacy policy |
| `/terms-of-use` | `/mentions-legales` | Terms of use |

## Internationalisation

Routes are locale-prefixed via next-intl. English is the default locale (no prefix), French uses `/fr/…`.

- Locale config: `src/i18n/routing.ts`
- Translations: `messages/en.json`, `messages/fr.json`
- All pages call `generateStaticParams()` to pre-render both locales

## Testing

Only `src/lib/business/calculations.ts` has unit tests. Tests run in Node (no DOM). When adding business logic to `calculations.ts`, add corresponding Vitest tests.

```bash
npx vitest run src/lib/business/calculations.test.ts
```

## Data privacy

All user data is stored exclusively in the browser's IndexedDB. The app has no backend, no authentication, and no network requests for user data. Clearing browser storage deletes all data permanently.
