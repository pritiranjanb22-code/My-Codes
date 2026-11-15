# School API — Project CLAUDE.md

> NestJS/Node.js - School management backend API

## Project Overview

**Stack:** NestJS 10, TypeScript, Prisma ORM, PostgreSQL, JWT Auth, Swagger/OpenAPI, Redis (caching), BullMQ (jobs)

**Architecture:** Modular monolith with domain-driven modules

## Critical Rules

### NestJS/TypeScript Specific

- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- NestJS modules per domain: `auth`, `users`, `courses`, `enrollments`, `grades`, `attendance`
- Prisma for database access, migrations in `prisma/migrations/`
- Guards for auth, Interceptors for logging/transform, Pipes for validation
- Swagger decorators on all DTOs and controllers

### Code Organization

- Feature modules in `src/modules/`
- Shared in `src/common/` (guards, interceptors, pipes, decorators, filters)
- Config in `src/config/` (env validation with Joi/Zod)
- Max 400 lines per file, 800 absolute max
- One class per file, barrel exports via `index.ts`

### Code Style

- No emojis in code, comments, or documentation
- Immutability: `readonly` properties, `Object.freeze()` for configs
- No `console.log` in production - use `Logger` service
- Proper error handling: Custom exceptions + Global exception filter
- Input validation: `class-validator` + `class-transformer` DTOs
- ESLint + Prettier with NestJS recommended config

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit: Jest + NestJS TestingModule
- Integration: Testcontainers for Postgres/Redis
- E2E: Supertest for API endpoints
- 80% minimum coverage for business logic

### Security

- No hardcoded secrets - `.env` (gitignored) + Docker secrets
- JWT: RS256 with rotating keys, short access tokens, refresh tokens
- Passwords: bcrypt with cost 12
- Rate limiting: `@nestjs/throttler` on all endpoints
- CORS: Restricted to frontend origin
- Helmet for security headers
- Prisma: Parameterized queries only (no raw SQL)

## File Structure

```
school-api/
|-- prisma/
|   |-- schema.prisma           # Database schema
|   |-- migrations/             # Prisma migrations
|   |-- seed.ts                 # Development seed
|-- src/
|   |-- common/
|   |   |-- decorators/         # CurrentUser, Roles, Public
|   |   |-- filters/            # GlobalExceptionFilter
|   |   |-- guards/             # JwtAuthGuard, RolesGuard, ThrottlerGuard
|   |   |-- interceptors/       # LoggingInterceptor, TransformInterceptor
|   |   |-- pipes/              # ValidationPipe, ParseUuidPipe
|   |   |-- dto/                # PaginationDto, ApiResponse
|   |-- config/
|   |   |-- configuration.ts    # Env validation (Joi)
|   |   |-- validation.ts       # Global validation pipe
|   |-- modules/
|   |   |-- auth/
|   |   |   |-- dto/            # LoginDto, RegisterDto, RefreshDto
|   |   |   |-- guards/         # JwtAuthGuard, LocalAuthGuard
|   |   |   |-- strategies/     # JwtStrategy, RefreshStrategy
|   |   |   |-- auth.controller.ts
|   |   |   |-- auth.service.ts
|   |   |   |-- auth.module.ts
|   |   |-- users/
|   |   |-- courses/
|   |   |-- enrollments/
|   |   |-- grades/
|   |   |-- attendance/
|   |-- app.module.ts
|   |-- main.ts                 # Bootstrap, Swagger, Global pipes
|-- test/                       # E2E tests
|-- package.json
|-- tsconfig.json
|-- nest-cli.json
|-- .env.example
|-- docker-compose.yml
|-- Dockerfile
```

## Key Patterns

### Module Structure

```typescript
// src/modules/courses/courses.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService],
})
export class CoursesModule {}
```

### Service with Prisma

```typescript
// src/modules/courses/courses.service.ts
@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async create(createCourseDto: CreateCourseDto, userId: string) {
    const course = await this.prisma.course.create({
      data: { ...createCourseDto, createdById: userId },
    });
    await this.cache.invalidate('courses:list');
    return course;
  }

  async findAll(query: PaginationDto) {
    const cacheKey = `courses:list:${JSON.stringify(query)}`;
    return this.cache.getOrSet(cacheKey, () => this.prisma.course.findMany({
      where: { isActive: true },
      skip: query.skip,
      take: query.take,
      orderBy: { createdAt: 'desc' },
    }));
  }
}
```

### Controller with Guards

```typescript
// src/modules/courses/courses.controller.ts
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiTags('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create course' })
  async create(@Body() dto: CreateCourseDto, @CurrentUser() user: User) {
    return this.coursesService.create(dto, user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List courses' })
  async findAll(@Query() query: PaginationDto) {
    return this.coursesService.findAll(query);
  }
}
```

## Environment Variables

```bash
# .env (gitignored)
DATABASE_URL=postgresql://user:pass@localhost:5432/school
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (TypeScript, ESLint)
- `/verify` - Full verification (build, test, lint, migrate)

## Development Commands

```bash
npm run start:dev          # Watch mode
npm run build              # Compile
npm run lint               # ESLint
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage
npx prisma migrate dev     # Run migrations
npx prisma studio          # DB GUI
npm run seed               # Seed database
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: lint, type-check, unit tests, E2E tests, migration check
- Deploy: Docker + Railway/Render/Kubernetes