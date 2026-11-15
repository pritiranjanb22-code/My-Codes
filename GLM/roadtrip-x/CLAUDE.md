# RoadTrip-X — Project CLAUDE.md

> React Native/Expo (TypeScript) - Trip planning app with AI, expenses, real-time chat

## Project Overview

**Stack:** React Native (Expo SDK 51), TypeScript, Expo Router, Supabase (Auth + Postgres + Realtime), Zustand, React Native Reanimated, React Query

**Architecture:** Feature-based modules with shared types
- `backend/` - Node.js/TypeScript API (Express + Supabase)
- `mobile/` - Expo React Native app

## Critical Rules

### TypeScript/React Native Specific

- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- Path aliases: `@/*` → `src/*`, `@backend/*` → `backend/src/*`
- Expo Router file-based routing in `mobile/app/`
- Supabase: Server client in backend, browser client in mobile
- Zustand for global state, React Query for server state
- Reanimated 3 for animations, Gesture Handler for interactions

### Code Organization

- Feature folders in `mobile/src/` and `backend/src/modules/`
- Max 400 lines per file, 800 absolute max
- Colocate components, hooks, types with features
- Shared types in `mobile/src/types/` and `backend/src/types/`

### Code Style

- No emojis in code, comments, or documentation
- Immutability: `readonly`, spread operators, Zustand `set((state) => ({...}))`
- No `console.log` in production - use `logger` utility
- Proper error handling: `Result<T>` pattern, React Query error boundaries
- Input validation: Zod schemas for all API inputs and forms
- `eslint.config.mjs` with `eslint-plugin-react-hooks`, `eslint-plugin-expo`

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: Vitest + React Native Testing Library
- Integration: MSW for API mocking
- E2E: Playwright (web) / Detox (native) - `/e2e` command
- 80% minimum coverage for business logic

### Security

- No hardcoded secrets - use `.env.local` (gitignored) + EAS secrets
- Supabase RLS enabled on all tables
- Validate all inputs with Zod on both client and server
- Secure storage: `expo-secure-store` for tokens
- API routes: authenticate with `createServerClient()`

## File Structure

```
roadtrip-x/
|-- backend/                     # Node.js API
|   |-- src/
|   |   |-- config/              # Supabase, Stripe, env
|   |   |-- database/            # Supabase client, migrations
|   |   |-- middleware/          # Auth, error handling, rate limiting
|   |   |-- modules/             # Feature modules
|   |   |   |-- ai/              # AI assistant
|   |   |   |-- auth/            # Authentication
|   |   |   |-- chat/            # Real-time chat
|   |   |   |-- emergency/       # SOS features
|   |   |   |-- expenses/        # Expense tracking
|   |   |   |-- location/        # GPS, maps
|   |   |   |-- notifications/   # Push, email
|   |   |   |-- trips/           # Trip CRUD
|   |   |   |-- vehicles/        # Vehicle health
|   |   |-- websocket/           # Realtime server
|   |   |-- index.ts             # Express entry
|   |-- package.json
|   |-- tsconfig.json
|
|-- mobile/                      # Expo React Native app
|   |-- app/                     # Expo Router screens
|   |   |-- (auth)/              # Login, register, forgot password
|   |   |-- (tabs)/              # Tab navigator screens
|   |   |-- trip/[id]/           # Dynamic trip routes
|   |   |-- _layout.tsx          # Root layout
|   |-- src/
|   |   |-- components/          # Reusable UI components
|   |   |   |-- ui/              # Base components (Button, Input, Card)
|   |   |   |-- forms/           # Form components with Zod
|   |   |   |-- trip/            # Trip-specific components
|   |   |-- constants/           # App constants, configs
|   |   |-- database/            # Local SQLite (expo-sqlite)
|   |   |-- hooks/               # Custom hooks
|   |   |-- navigation/          # Navigation types, helpers
|   |   |-- screens/             # Screen components (legacy)
|   |   |-- services/            # API client, Supabase client
|   |   |-- store/               # Zustand stores
|   |   |-- types/               # Shared TypeScript types
|   |   |-- utils/               # Helpers, formatters
|   |-- package.json
|   |-- tsconfig.json
|   |-- app.json                 # Expo config
|
|-- .env.example                 # Environment template
|-- README.md
```

## Key Patterns

### API Route with Zod Validation

```typescript
// backend/src/modules/trips/routes.ts
import { z } from 'zod';
import { createServerClient } from '@/config/supabase';

const createTripSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export async function createTrip(req: Request, res: Response) {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('trips')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: 'Failed to create trip' });
  return res.json({ success: true, data });
}
```

### Mobile Screen with React Query

```typescript
// mobile/app/(tabs)/trips.tsx
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '@/services/api';

export default function TripsScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: tripsApi.getAll,
  });

  if (isLoading) return <ActivityIndicator />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <TripCard trip={item} />}
    />
  );
}
```

### Zustand Store with Immutability

```typescript
// mobile/src/store/trips.ts
import { create } from 'zustand';
import { Trip } from '@/types';

interface TripsState {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  removeTrip: (id: string) => void;
}

export const useTripsStore = create<TripsState>((set) => ({
  trips: [],
  addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
  updateTrip: (id, updates) => set((state) => ({
    trips: state.trips.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  removeTrip: (id) => set((state) => ({
    trips: state.trips.filter(t => t.id !== id)
  })),
}));
```

## Environment Variables

```bash
# backend/.env (gitignored)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
PORT=3000

# mobile/.env.local (gitignored)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (TypeScript, ESLint)
- `/e2e` - Playwright/Detox E2E tests
- `/test-coverage` - Verify 80%+ coverage

## Development Commands

```bash
# Backend
cd backend && npm run dev          # Start with tsx watch
cd backend && npm run build        # TypeScript compile
cd backend && npm run lint         # ESLint
cd backend && npm test             # Vitest

# Mobile
cd mobile && npx expo start        # Expo dev server
cd mobile && npx expo lint         # Expo + ESLint
cd mobile && npm test              # Vitest
cd mobile && npx playwright test   # E2E tests (web)
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: lint, type-check, unit tests, E2E tests
- Deploy: EAS Build for mobile, Railway/Render for backend