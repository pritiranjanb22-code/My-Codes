# Finance App - Project Agents

## Overview
React Native/Expo personal finance tracking with SQLite, budgets, expenses, reports.

## Agent Usage
- **planner**: Financial features, calculation logic
- **tdd-guide**: Vitest + React Native Testing Library (80%+ for calculations)
- **code-reviewer**: TypeScript/React Native, immutable Zustand updates
- **security-reviewer**: Local-only DB, secure storage for tokens, input validation
- **build-error-resolver**: TypeScript/ESLint/Expo build errors
- **e2e-runner**: Detox for native E2E
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- Expo SDK 51, Expo Router in `app/`
- SQLite via `expo-sqlite` for offline-first
- Zustand for state, React Hook Form + Zod for forms
- Build: `npx expo start`, `npm test`, `npx expo lint`

## ECC Compliance
- Uses global ECC agents, commands, skills
- React Native/Expo patterns in CLAUDE.md