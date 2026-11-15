# RoadTrip-X - Project Agents

## Overview
React Native/Expo trip planning app with AI, expenses, real-time chat. Monorepo: backend (Node.js) + mobile (Expo).

## Agent Usage
- **planner**: Cross-platform features, API design
- **tdd-guide**: Vitest (backend), Vitest + React Native Testing Library (mobile)
- **code-reviewer**: TypeScript/React Native code quality
- **security-reviewer**: Supabase RLS, Zod validation, API auth, secure storage
- **build-error-resolver**: TypeScript/ESLint/Expo build errors
- **e2e-runner**: Playwright (web), Detox (native) for critical flows
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- Backend: Express + Supabase, modules in `src/modules/`
- Mobile: Expo Router, `app/` routes, Zustand + React Query
- Shared types between backend/mobile
- Build: `npm run dev` (both), `npx expo start` (mobile)

## ECC Compliance
- Uses global ECC agents, commands, skills
- React Native/Expo patterns in CLAUDE.md