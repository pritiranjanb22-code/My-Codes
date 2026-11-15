# School Web - Project Agents

## Overview
Next.js 14 (App Router) school management frontend with Supabase SSR, React Query, Zustand, Tailwind.

## Agent Usage
- **planner**: Dashboard features, UI/UX flows
- **tdd-guide**: Vitest + React Testing Library, MSW for API mocking
- **code-reviewer**: Next.js/React patterns, Server/Client Components, Zod forms
- **security-reviewer**: Supabase SSR auth, RLS, CSP headers, env var handling
- **build-error-resolver**: TypeScript/ESLint/Next.js build errors
- **e2e-runner**: Playwright for critical flows (auth, courses, grades)
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- Next.js 14 App Router, Route Groups: `(auth)`, `(dashboard)`, `(public)`
- Supabase SSR: `createServerClient()` / `createBrowserClient()`
- State: React Query (server), Zustand (UI)
- UI: shadcn/ui pattern in `components/ui/`
- Build: `npm run dev`, `npm run build`, `npm run lint`, `npx playwright test`

## ECC Compliance
- Uses global ECC agents, commands, skills
- Next.js/Supabase patterns in CLAUDE.md