# School Web — Project CLAUDE.md

> Next.js 14 (App Router) - School management frontend

## Project Overview

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth), React Query, Zustand, React Hook Form + Zod, Playwright

**Architecture:** Server Components by default, Client Components for interactivity

## Critical Rules

### Next.js/React Specific

- Strict TypeScript (`strict: true`)
- App Router with Route Groups: `(auth)`, `(dashboard)`, `(public)`
- Server Components by default, `'use client'` only when needed
- Supabase SSR: `createServerClient()` in Server Components, `createBrowserClient()` in Client Components
- React Query for server state, Zustand for UI state
- Path aliases: `@/*` → `src/*`

### Code Organization

- Feature folders in `src/app/(dashboard)/` and `src/components/`
- Max 400 lines per file, 800 absolute max
- Colocate components, hooks, types with features
- Shared UI in `src/components/ui/` (shadcn/ui pattern)

### Code Style

- No emojis in code, comments, or documentation
- Immutability: spread operators, Zustand immutable updates
- No `console.log` in production - use `logger` utility
- Proper error handling: `ErrorBoundary`, React Query error states
- Input validation: Zod schemas for all forms
- ESLint + Prettier with Next.js config

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: Vitest + React Testing Library
- Integration: MSW for API mocking
- E2E: Playwright - `/e2e` command
- 80% minimum coverage for business logic

### Security

- No hardcoded secrets - `.env.local` (gitignored) + Vercel secrets
- Supabase RLS on all tables
- Client-side: Never expose service role key
- Server-side: `createServerClient()` with cookies
- Validate all form inputs with Zod
- CSP headers in `next.config.mjs`

## File Structure

```
school-web/
|-- src/
|   |-- app/
|   |   |-- (auth)/              # Login, register, forgot password
|   |   |   |-- login/page.tsx
|   |   |   |-- register/page.tsx
|   |   |-- (dashboard)/         # Protected routes
|   |   |   |-- layout.tsx       # Dashboard layout with sidebar
|   |   |   |-- courses/
|   |   |   |   |-- page.tsx     # Course list
|   |   |   |   |-- [id]/page.tsx # Course detail
|   |   |   |-- grades/
|   |   |   |-- attendance/
|   |   |   |-- profile/
|   |   |   |-- settings/
|   |   |-- (public)/            # Public pages
|   |   |   |-- page.tsx         # Landing page
|   |   |-- api/                 # API routes (webhooks, etc.)
|   |   |-- globals.css          # Tailwind + global styles
|   |   |-- layout.tsx           # Root layout
|   |   |-- providers.tsx        # QueryClient, Supabase, Theme
|   |-- components/
|   |   |-- ui/                  # Base components (Button, Input, Card, Table, Modal)
|   |   |-- forms/               # Form components with React Hook Form + Zod
|   |   |-- dashboard/           # Dashboard-specific (Sidebar, Header, StatsCards)
|   |   |-- courses/             # CourseCard, CourseList, CourseForm
|   |   |-- grades/              # GradeTable, GradeChart
|   |   |-- attendance/          # AttendanceCalendar, AttendanceStats
|   |-- hooks/                   # Custom hooks (useAuth, useCourses, etc.)
|   |-- lib/
|   |   |-- supabase/            # Server & browser clients
|   |   |-- utils.ts             # cn(), formatters, validators
|   |   |-- api.ts               # API client with React Query
|   |-- store/                   # Zustand stores
|   |   |-- useAuthStore.ts
|   |   |-- useUIStore.ts
|   |-- types/                   # TypeScript types
|   |-- styles/                  # Additional CSS
|-- public/
|-- package.json
|-- tsconfig.json
|-- next.config.mjs
|-- tailwind.config.ts
|-- postcss.config.mjs
|-- eslint.config.mjs
|-- playwright.config.ts
|-- .env.local.example
|-- README.md
```

## Key Patterns

### Server Component with Supabase

```typescript
// src/app/(dashboard)/courses/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { CourseList } from '@/components/courses/CourseList';

export default async function CoursesPage() {
  const supabase = createServerClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*, teacher:users(name, email)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return <CourseList courses={courses ?? []} />;
}
```

### Client Component with React Query

```typescript
// src/components/courses/CourseList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CourseCard } from './CourseCard';

export function CourseList({ initialCourses }: { initialCourses: Course[] }) {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: api.courses.getAll,
    initialData: initialCourses,
  });

  if (isLoading) return <Skeleton className="h-20" count={5} />;
  if (error) return <Alert variant="destructive">Failed to load courses</Alert>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses?.map(course => <CourseCard key={course.id} course={course} />)}
    </div>
  );
}
```

### Form with React Hook Form + Zod

```typescript
// src/components/courses/CourseForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  credits: z.number().int().positive().max(10),
});

type FormData = z.infer<typeof schema>;

export function CourseForm({ onSubmit, defaultValues }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Course Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      {/* ... other fields */}
      <Button type="submit">Save</Button>
    </form>
  );
}
```

## Environment Variables

```bash
# .env.local (gitignored)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (TypeScript, ESLint)
- `/e2e` - Playwright E2E tests
- `/test-coverage` - Verify 80%+ coverage

## Development Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # tsc --noEmit
npm test                 # Vitest
npm run test:e2e         # Playwright
npm run test:coverage    # Coverage report
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: lint, type-check, unit tests, E2E tests
- Deploy: Vercel (preview on PR, production on merge)