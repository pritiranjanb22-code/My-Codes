# Grocery Delivery - Project Agents

## Overview
Multi-project monorepo: Admin Dashboard (Next.js), Backend (Node.js/Express), Mobile App (React Native/Expo). Shared Supabase backend.

## Agent Usage
- **planner**: Cross-project features, API contracts
- **tdd-guide**: 
  - Admin: Vitest + React Testing Library
  - Backend: Vitest + Testcontainers
  - Mobile: Vitest + React Native Testing Library
- **code-reviewer**: TypeScript across all three projects
- **security-reviewer**: Supabase RLS, JWT auth, Stripe webhooks, role-based access
- **build-error-resolver**: TypeScript/ESLint/Next.js/Expo build errors
- **e2e-runner**: Playwright (admin/web), Detox (mobile)
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- Admin: Next.js 14 App Router, shadcn/ui, React Query
- Backend: Express, Supabase, BullMQ/Redis, Stripe
- Mobile: Expo Router, Supabase Realtime
- Shared: `shared-types/` npm package
- Build: `npm run dev` (Turborepo), individual project commands

## ECC Compliance
- Uses global ECC agents, commands, skills
- Monorepo + multi-platform patterns in CLAUDE.md