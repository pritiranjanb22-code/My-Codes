# School Management System API

A production-ready, multi-tenant School Management System built with NestJS, Prisma, and PostgreSQL.

## Features

- **Multi-tenant Architecture**: Complete data isolation between schools
- **Role-Based Access Control**: SUPER_ADMIN, HEADMASTER, TEACHER, PARENT
- **Authentication & Authorization**: JWT with refresh tokens, Argon2 password hashing
- **Student Management**: Admission, promotion, transfer, class history
- **Attendance System**: Daily attendance with offline sync support
- **Academic Management**: Classes, sections, subjects, exams, marks
- **Parent Portal**: Attendance, results, announcements
- **Audit Logging**: Complete audit trail for all critical operations
- **Notifications**: Announcements, holidays, exam schedules

## Tech Stack

- **Framework**: NestJS 10 (TypeScript)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: JWT + Passport, Argon2
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Rate Limiting**: @nestjs/throttler
- **Security**: Helmet, CORS, compression

## Project Structure

```
src/
├── common/                 # Shared utilities
│   ├── decorators/         # Custom decorators (@CurrentUser, @Roles, etc.)
│   ├── guards/             # Auth guards (JWT, Roles, SchoolScope)
│   ├── interceptors/       # Audit log interceptor
│   ├── filters/            # Global exception filter
│   └── strategies/         # Passport strategies
├── config/                 # Configuration modules
├── modules/                # Feature modules
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── schools/            # School management
│   ├── students/           # Student management
│   ├── teachers/           # Teacher management
│   ├── parents/            # Parent management
│   ├── classes/            # Class management
│   ├── sections/           # Section management
│   ├── subjects/           # Subject management
│   ├── attendance/         # Attendance system
│   ├── exams/              # Exam management
│   ├── marks/              # Marks/Results
│   ├── holidays/           # Holiday management
│   ├── announcements/      # Announcements
│   └── audit-logs/         # Audit logging
└── prisma/                 # Prisma schema & service
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/school_management?schema=public"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run start:dev
```

### Docker Deployment

```bash
# Set environment variables
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-super-secret-jwt-key

# Start services
docker-compose up -d

# Run migrations
docker-compose exec api npm run prisma:migrate

# Seed database
docker-compose exec api npm run prisma:seed
```

## API Documentation

Once running, access Swagger UI at: `http://localhost:3000/api/docs`

### Key Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/v1/auth/login`, `POST /api/v1/auth/register/headmaster`, `POST /api/v1/auth/refresh` |
| Schools | `GET /api/v1/schools`, `POST /api/v1/schools`, `GET /api/v1/schools/dashboard` |
| Users | `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id/approve` |
| Students | `GET /api/v1/students`, `POST /api/v1/students`, `PATCH /api/v1/students/:id/promote` |
| Teachers | `GET /api/v1/teachers`, `POST /api/v1/teachers`, `GET /api/v1/teachers/my-classes` |
| Parents | `GET /api/v1/parents`, `POST /api/v1/parents`, `GET /api/v1/parents/my-children` |
| Classes | `GET /api/v1/classes`, `POST /api/v1/classes` |
| Attendance | `POST /api/v1/attendance`, `GET /api/v1/attendance/class/:classId/section/:sectionId/date/:date` |
| Exams | `GET /api/v1/exams`, `POST /api/v1/exams`, `POST /api/v1/exams/:id/subjects` |
| Marks | `POST /api/v1/marks`, `POST /api/v1/marks/bulk`, `POST /api/v1/marks/publish` |
| Holidays | `GET /api/v1/holidays`, `POST /api/v1/holidays` |
| Announcements | `GET /api/v1/announcements/published`, `POST /api/v1/announcements` |
| Audit Logs | `GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/stats` |

## Role Permissions

| Feature | SUPER_ADMIN | HEADMASTER | TEACHER | PARENT |
|---------|-------------|------------|---------|--------|
| Manage Schools | ✅ | ❌ | ❌ | ❌ |
| Approve Headmasters | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ (own school) | ❌ | ❌ |
| Manage Students | ✅ | ✅ | ✅ (assigned) | View own |
| Manage Teachers | ✅ | ✅ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ (assigned) | ❌ |
| Enter Marks | ✅ | ✅ | ✅ (assigned) | ❌ |
| Publish Results | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ (assigned) | Own children |
| Announcements | ✅ | ✅ | View | View |
| Audit Logs | ✅ | ✅ (own school) | ❌ | ❌ |

## Multi-Tenancy

All data is scoped by `schoolId`. The `SchoolScopeGuard` ensures:
- Users can only access data from their school
- SUPER_ADMIN can access all schools via `schoolId` parameter
- Cross-school data access is prevented at database level

## Offline Attendance Sync

Teachers can mark attendance offline. The mobile app should:
1. Cache student list for assigned classes
2. Store attendance locally with `syncedAt: null`
3. Call `POST /api/v1/attendance/offline-sync` when online
4. Server processes each record, handles conflicts

## Security

- Passwords hashed with Argon2id
- JWT tokens with short expiry (15min) + refresh tokens (7d)
- Rate limiting: 100 requests/minute
- Helmet.js for security headers
- CORS configured for specific origins
- Input validation on all endpoints
- SQL injection prevented via Prisma

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Environment Variables

See `.env.example` for all configuration options.

## License

MIT