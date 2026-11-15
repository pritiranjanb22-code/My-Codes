# Finance App — Project CLAUDE.md

> React Native/Expo (TypeScript) - Personal finance tracking with budgets, expenses, reports

## Project Overview

**Stack:** React Native (Expo SDK 51), TypeScript, Expo Router, SQLite (expo-sqlite), Zustand, React Native Chart Kit, React Hook Form + Zod

**Architecture:** Offline-first with local SQLite, optional cloud sync

## Critical Rules

### TypeScript/React Native Specific

- Strict TypeScript (`strict: true`)
- Path aliases: `@/*` → `src/*`
- Expo Router file-based routing in `app/`
- SQLite for local persistence (expo-sqlite)
- Zustand for global state, React Query for async state

### Code Organization

- Feature folders in `src/`: `components/`, `screens/`, `services/`, `store/`, `db/`, `hooks/`
- Max 400 lines per file, 800 absolute max
- Colocate components, hooks, types with features

### Code Style

- No emojis in code, comments, or documentation
- Immutability: Zustand with immutable updates
- No `console.log` in production - use `logger` utility
- Proper error handling: `Result<T>` pattern
- Input validation: Zod for forms and database inputs

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: Vitest + React Native Testing Library
- 80% minimum coverage for business logic (calculations, budgets)

### Security

- No hardcoded secrets
- Local database only (no cloud sync by default)
- Validate all numeric inputs (amounts, budgets)
- Secure storage for any auth tokens (expo-secure-store)

## File Structure

```
finance-app/
|-- app/                     # Expo Router screens
|   |-- (tabs)/              # Tab navigator
|   |   |-- dashboard.tsx
|   |   |-- expenses.tsx
|   |   |-- budgets.tsx
|   |   |-- reports.tsx
|   |   |-- settings.tsx
|   |-- _layout.tsx
|-- src/
|   |-- components/
|   |   |-- ui/              # Button, Input, Card, Modal, Charts
|   |   |-- forms/           # ExpenseForm, BudgetForm
|   |   |-- charts/          # ExpenseChart, BudgetProgress
|   |-- db/                  # SQLite
|   |   |-- DatabaseService.ts
|   |   |-- migrations/
|   |   |-- repositories/    # ExpenseRepository, BudgetRepository
|   |-- hooks/               # Custom hooks
|   |-- screens/             # Screen components
|   |-- services/            # Business logic
|   |   |-- ExpenseService.ts
|   |   |-- BudgetService.ts
|   |   |-- ReportService.ts
|   |-- store/               # Zustand stores
|   |   |-- useExpenseStore.ts
|   |   |-- useBudgetStore.ts
|   |   |-- useSettingsStore.ts
|   |-- types/               # TypeScript types
|   |-- utils/               # Helpers, formatters, validators
|-- assets/
|-- package.json
|-- tsconfig.json
|-- app.json
```

## Key Patterns

### Database Repository

```typescript
// src/db/repositories/ExpenseRepository.ts
export class ExpenseRepository {
  constructor(private db: SQLiteDatabase) {}

  async getByDateRange(start: Date, end: Date): Promise<Expense[]> {
    return this.db.getAllAsync(
      'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      start.toISOString(), end.toISOString()
    );
  }

  async create(expense: ExpenseInput): Promise<Expense> {
    const id = crypto.randomUUID();
    await this.db.runAsync(
      'INSERT INTO expenses (id, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, expense.amount, expense.category, expense.description, expense.date, new Date().toISOString()
    );
    return { id, ...expense, createdAt: new Date().toISOString() };
  }
}
```

### Budget Calculation Service

```typescript
// src/services/BudgetService.ts
export class BudgetService {
  calculateRemaining(budget: Budget, expenses: Expense[]): number {
    const spent = expenses
      .filter(e => e.category === budget.category && e.date >= budget.startDate)
      .reduce((sum, e) => sum + e.amount, 0);
    return budget.amount - spent;
  }

  isOverBudget(budget: Budget, expenses: Expense[]): boolean {
    return this.calculateRemaining(budget, expenses) < 0;
  }
}
```

## Environment Variables

```bash
# .env.local (gitignored)
EXPO_PUBLIC_CURRENCY=USD
EXPO_PUBLIC_DATE_FORMAT=MM/dd/yyyy
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (TypeScript, ESLint)
- `/test-coverage` - Verify 80%+ coverage

## Development Commands

```bash
npx expo start          # Start dev server
npx expo start -c       # Clear cache
npx expo lint           # Lint
npx tsc --noEmit        # Type check
npm test                # Vitest
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: lint, type-check, unit tests
- Deploy: EAS Build