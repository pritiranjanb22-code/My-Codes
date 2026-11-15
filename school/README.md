# School Management System

A comprehensive, production-ready School Management System for Classes 1-8 with multi-tenant architecture, role-based access control, and mobile-first design.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Nginx      │  │   Nginx      │  │   Nginx      │          │
│  │   (Port 80)  │  │   (Port 443) │  │   (Internal) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│  ┌──────▼─────────────────▼─────────────────▼───────┐          │
│  │              Reverse Proxy                        │          │
│  └──────────────────────────────────────────────────┘          │
│         │                       │                       │       │
│  ┌──────▼───────┐      ┌────────▼────────┐      ┌──────▼───────┐ │
│  │   Web App    │      │   API Server    │      │  PostgreSQL  │ │
│  │  (Next.js)   │◄────►│   (NestJS)      │◄────►│   (Primary)  │ │
│  │  Port 3001   │      │   Port 3000     │      │   Port 5432  │ │
│  └──────────────┘      └─────────────────┘      └──────────────┘ │
│                                │                                 │
│                        ┌────────▼────────┐                       │
│                        │     Redis       │                       │
│                        │   (Cache/Queue) │                       │
│                        │   Port 6379     │                       │
│                        └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Components

| Component | Technology | Port | Description |
|-----------|------------|------|-------------|
| **API Server** | NestJS 10 + TypeScript | 3000 | RESTful API with multi-tenant support |
| **Web App** | Next.js 14 + TypeScript | 3001 | Admin dashboards + Parent portal |
| **Database** | PostgreSQL 16 | 5432 | Primary data store with Prisma ORM |
| **Cache/Queue** | Redis 7 | 6379 | Caching, sessions, job queues |
| **Reverse Proxy** | Nginx | 80/443 | SSL termination, routing |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ (if not using Docker)

### Using Docker (Recommended)

```bash
# Clone and navigate
cd school

# Set environment variables
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npm run prisma:migrate

# Seed demo data
docker-compose exec api npm run prisma:seed

# Access applications
# Web App: http://localhost
# API Docs: http://localhost/api/docs
# API Server: http://localhost:3000
```

### Local Development

```bash
# Terminal 1: Start database
docker-compose up -d postgres redis

# Terminal 2: Start API
cd school-api
cp .env.example .env
# Edit .env with your database URL
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Terminal 3: Start Web App
cd school-web
cp .env.local.example .env.local
# Edit .env.local if needed
npm install
npm run dev
```

## 🔐 Demo Credentials

After seeding the database:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Super Admin** | superadmin@school.com | SuperAdmin123! | Full system access |
| **Headmaster** | headmaster@demo.com | Headmaster123! | School management |
| **Teacher** | teacher1@demo.com | Teacher123! | Class/attendance/marks |
| **Parent** | (linked via headmaster) | (set by headmaster) | Child's data only |

## 📋 Features by Role

### Super Admin
- ✅ Multi-school management
- ✅ Headmaster approval workflow
- ✅ System-wide statistics & audit logs
- ✅ Cross-school user management

### Headmaster
- ✅ School dashboard with real-time metrics
- ✅ Student lifecycle (admission → promotion → transfer)
- ✅ Teacher management (invite, assign, approve)
- ✅ Class/section/subject configuration
- ✅ Attendance monitoring & reports
- ✅ Exam scheduling & results workflow
- ✅ Announcements & holiday calendar
- ✅ School settings & academic years

### Teacher
- ✅ My classes dashboard
- ✅ Daily attendance marking (offline-capable)
- ✅ Marks entry for assigned subjects
- ✅ Student roster & profiles
- ✅ Announcements & holiday view

### Parent
- ✅ Multi-child dashboard
- ✅ Attendance statistics & history
- ✅ Exam results & report cards
- ✅ Announcements & notifications
- ✅ Holiday calendar
- ✅ Quick actions

## 🏛️ Multi-Tenancy

- **Complete data isolation** per school via `schoolId` on every model
- **Row-level security** enforced at API layer with `SchoolScopeGuard`
- **Super Admin** can access all schools via explicit `schoolId` parameter
- **Zero cross-school data leakage** possible

## 🔒 Security Features

- **JWT Authentication** with short-lived access tokens (15min) + refresh tokens (7d)
- **Argon2id** password hashing
- **Role-Based Access Control** (SUPER_ADMIN, HEADMASTER, TEACHER, PARENT)
- **Rate Limiting** (100 req/min default)
- **Helmet.js** security headers
- **CORS** configured for specific origins
- **Input Validation** on all endpoints (class-validator + Zod)
- **Audit Logging** for all critical operations
- **SQL Injection Prevention** via Prisma ORM

## 📱 Offline Attendance (Mobile-Ready)

The API supports offline-first attendance:
1. Teacher downloads student list for assigned classes
2. Marks attendance offline (stored locally with `syncedAt: null`)
3. Calls `POST /attendance/offline-sync` when online
4. Server processes batch, handles conflicts, returns sync status

## 📊 Reporting & Analytics

- **Attendance Reports**: Daily, monthly, quarterly, yearly with filters
- **Academic Reports**: Subject-wise, exam-wise, class-wise performance
- **Export Formats**: PDF, Excel/CSV (planned)
- **Real-time Dashboards**: Charts via Recharts

## 🧪 Testing

```bash
# API Tests
cd school-api
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report

# Web App Tests
cd school-web
npm run test          # Component tests
npm run test:e2e      # Playwright E2E
```

## 📁 Project Structure

```
school/
├── docker-compose.yml          # Main orchestration
├── nginx.conf                  # Reverse proxy config
├── school-api/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/            # 14 feature modules
│   │   ├── common/             # Guards, decorators, interceptors
│   │   ├── config/             # Configuration modules
│   │   └── prisma/             # Database schema & service
│   ├── prisma/
│   │   └── schema.prisma       # 50+ models with relations
│   └── Dockerfile
├── school-web/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # UI, Layout, Forms, Charts
│   │   ├── contexts/           # Auth, School providers
│   │   ├── lib/                # API client, utilities
│   │   └── types/              # Shared TypeScript types
│   └── Dockerfile
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### API (school-api/.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

#### Web (school-web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=SchoolMS
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 📈 API Documentation

Once running, access Swagger UI at: `http://localhost/api/docs`

### Key Endpoint Groups

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Login, register, tokens, passwords |
| Schools | `/api/v1/schools` | School CRUD, dashboard stats |
| Users | `/api/v1/users` | User management, approvals |
| Students | `/api/v1/students` | Admission, promotion, reports |
| Teachers | `/api/v1/teachers` | Invite, assignments, classes |
| Parents | `/api/v1/parents` | Linking, child access |
| Classes | `/api/v1/classes` | Class management |
| Attendance | `/api/v1/attendance` | Marking, reports, offline sync |
| Exams | `/api/v1/exams` | Exam types, scheduling |
| Marks | `/api/v1/marks` | Entry, workflow, publishing |
| Holidays | `/api/v1/holidays` | Calendar management |
| Announcements | `/api/v1/announcements` | Targeted communications |
| Audit Logs | `/api/v1/audit-logs` | System activity tracking |

## 🚢 Production Deployment

### Checklist
- [ ] Set strong `JWT_SECRET` (32+ chars)
- [ ] Set secure `DB_PASSWORD`
- [ ] Configure `CORS_ORIGIN` to your domain
- [ ] Set up SSL certificates in `./ssl/`
- [ ] Configure Nginx for your domain
- [ ] Set up database backups
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Set up log aggregation
- [ ] Test disaster recovery

### Environment-Specific
```bash
# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- Next.js team for the React framework
- Prisma team for the modern ORM
- Tailwind CSS for utility-first styling
- All open-source contributors

---

**Built with ❤️ for education**