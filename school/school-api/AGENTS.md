# School API - Project Agents

## Overview
NestJS/Node.js school management backend with Prisma, PostgreSQL, JWT, Redis, BullMQ.

## Agent Usage
- **planner**: Domain modules, API design, migration planning
- **tdd-guide**: Jest unit tests, Testcontainers integration tests, Supertest E2E
- **code-reviewer**: NestJS patterns, TypeScript strict, class-validator DTOs
- **security-reviewer**: JWT RS256, bcrypt, rate limiting, Helmet, CORS, Prisma param queries
- **build-error-resolver**: TypeScript/ESLint/NestJS build errors
- **database-reviewer**: Prisma queries, indexes, migrations, RLS patterns
- **go-reviewer** / **go-build-resolver**: Not applicable

## Project Context
- NestJS 10, modules: auth, users, courses, enrollments, grades, attendance
- Prisma ORM, migrations in `prisma/migrations/`
- Guards: JwtAuthGuard, RolesGuard, ThrottlerGuard
- Build: `npm run start:dev`, `npm run build`, `npm run test`, `npx prisma migrate dev`

## ECC Compliance
- Uses global ECC agents, commands, skills
- NestJS/Prisma patterns in CLAUDE.md