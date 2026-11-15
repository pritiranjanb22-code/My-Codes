# Grocery Delivery — Project CLAUDE.md

> Multi-project: Admin Dashboard (Next.js), Backend (Node.js/Express), Mobile App (React Native/Expo)

## Project Overview

**Stack:**
- **Admin Dashboard:** Next.js 14 (App Router), TypeScript, Tailwind, Supabase, Recharts
- **Backend:** Node.js/Express, TypeScript, Supabase (Postgres), Stripe, Redis (BullMQ)
- **Mobile App:** React Native/Expo, TypeScript, Expo Router, Supabase Realtime

**Architecture:** Microservices with shared Supabase backend

## Critical Rules

### Cross-Project Standards

- Shared types in `shared-types/` package (published to npm/GitHub Packages)
- Supabase as single source of truth for data
- API contracts defined with Zod, validated on both ends
- Monorepo managed with npm workspaces or Turborepo

### Code Organization

- Each project in its own folder with independent `package.json`
- Shared configs: `eslint.config.mjs`, `tsconfig.base.json` at root
- Max 400 lines per file, 800 absolute max

### Code Style

- No emojis in code, comments, or documentation
- Immutability: spread operators, immutable state updates
- No `console.log` in production - use structured logging (Pino/Winston)
- Input validation: Zod schemas for all API inputs
- ESLint + Prettier configured per project

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: Vitest/Jest per project
- Integration: Testcontainers for backend, MSW for frontend
- E2E: Playwright for admin/mobile web, Detox for mobile native
- 80% minimum coverage for business logic

### Security

- No hardcoded secrets - `.env.local` per project + EAS/Vercel secrets
- Supabase RLS on all tables
- Admin: Role-based access (admin, manager, viewer)
- Backend: JWT auth, rate limiting, CORS, helmet
- Mobile: Secure storage, certificate pinning
- Stripe: Webhook signature verification

## File Structure

```
grocery-delivery/
|-- admin-dashboard/              # Next.js Admin
|   |-- src/
|   |   |-- app/                  # App Router pages
|   |   |   |-- (auth)/           # Login, register
|   |   |   |-- (dashboard)/      # Protected admin pages
|   |   |   |   |-- orders/
|   |   |   |   |-- products/
|   |   |   |   |-- users/
|   |   |   |   |-- analytics/
|   |   |   |-- api/              # API routes
|   |   |-- components/           # Shared UI (shadcn/ui)
|   |   |-- lib/                  # Supabase, Stripe, utils
|   |   |-- hooks/                # Custom hooks
|   |   |-- types/                # Admin-specific types
|   |-- package.json
|   |-- tsconfig.json
|   |-- next.config.mjs
|
|-- backend/                      # Node.js/Express API
|   |-- src/
|   |   |-- config/               # Supabase, Stripe, Redis, env
|   |   |-- modules/              # Feature modules
|   |   |   |-- auth/
|   |   |   |-- orders/
|   |   |   |-- products/
|   |   |   |-- payments/
|   |   |   |-- notifications/
|   |   |   |-- delivery/
|   |   |-- middleware/           # Auth, error, rate limit, validation
|   |   |-- jobs/                 # BullMQ workers
|   |   |-- index.ts              # Express entry
|   |-- package.json
|   |-- tsconfig.json
|
|-- mobile-app/                   # React Native/Expo
|   |-- app/                      # Expo Router
|   |   |-- (auth)/
|   |   |-- (tabs)/
|   |   |-- (shop)/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- services/             # API client, Supabase
|   |   |-- store/                # Zustand
|   |   |-- types/
|   |   |-- utils/
|   |-- package.json
|   |-- app.json
|
|-- shared-types/                 # Shared TypeScript types (npm package)
|   |-- src/
|   |   |-- order.ts
|   |   |-- product.ts
|   |   |-- user.ts
|   |   |-- delivery.ts
|   |-- package.json
|
|-- package.json                  # Root workspace
|-- turbo.json                    # Turborepo config (optional)
|-- .env.example
|-- README.md
```

## Key Patterns

### Shared Types Package

```typescript
// shared-types/src/order.ts
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  deliveryAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
```

### Backend API with Zod

```typescript
// backend/src/modules/orders/routes.ts
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  deliveryAddress: addressSchema,
});

export async function createOrder(req: AuthRequest, res: Response) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  const order = await orderService.create(req.user.id, parsed.data);
  return res.json({ success: true, data: order });
}
```

### Mobile App with React Query

```typescript
// mobile-app/src/hooks/useOrders.ts
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.orders.getMyOrders(),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.orders.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

## Environment Variables

```bash
# admin-dashboard/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# backend/.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
REDIS_URL=
JWT_SECRET=
PORT=3000

# mobile-app/.env.local
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors
- `/e2e` - Playwright/Detox E2E tests
- `/test-coverage` - Verify 80%+ coverage

## Development Commands

```bash
# Root (with Turborepo)
npm run dev              # Start all dev servers
npm run build            # Build all projects
npm run test             # Test all projects
npm run lint             # Lint all projects

# Individual projects
cd admin-dashboard && npm run dev
cd backend && npm run dev
cd mobile-app && npx expo start
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs per project: lint, type-check, unit tests, E2E tests
- Deploy: Vercel (admin), Railway/Render (backend), EAS Build (mobile)