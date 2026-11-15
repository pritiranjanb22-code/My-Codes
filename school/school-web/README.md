# School Management System - Web Application

A modern, responsive web application for the School Management System built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Role-Based Dashboards**: Super Admin, Headmaster, Teacher, Parent
- **Real-time Data**: Powered by TanStack Query for caching and synchronization
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: System-aware dark/light theme support
- **Type Safety**: Full TypeScript support with shared types

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query) + Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: JWT with HttpOnly cookies (via backend API)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard (role-based)
│   ├── auth/               # Authentication pages
│   ├── students/           # Student management
│   ├── teachers/           # Teacher management
│   ├── classes/            # Class management
│   ├── attendance/         # Attendance marking
│   ├── exams/              # Exam management
│   ├── marks/              # Marks/Results entry
│   ├── holidays/           # Holiday calendar
│   ├── announcements/      # Announcements
│   ├── reports/            # Analytics & Reports
│   ├── settings/           # User & School settings
│   └── parent/             # Parent portal
├── components/
│   ├── ui/                 # Base UI components (Button, Input, Card, etc.)
│   ├── layout/             # Layout components (Sidebar, Header, DashboardLayout)
│   ├── forms/              # Form components
│   ├── charts/             # Chart components
│   └── tables/             # Table components
├── contexts/               # React Context providers (Auth, School)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (API client, auth, helpers)
└── types/                  # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see `../school-api`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Update NEXT_PUBLIC_API_URL to point to your backend
# Default: http://localhost:3000/api/v1

# Start development server
npm run dev
```

The app will be available at `http://localhost:3001`

### Demo Credentials

After seeding the backend database:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@school.com | SuperAdmin123! |
| Headmaster | headmaster@demo.com | Headmaster123! |
| Teacher | teacher1@demo.com | Teacher123! |

## Key Features by Role

### Super Admin
- Manage all schools
- Approve/reject headmaster registrations
- System-wide statistics and audit logs
- User management across schools

### Headmaster
- School dashboard with key metrics
- Student management (CRUD, promotion, transfer)
- Teacher management (invite, assign, approve)
- Class/section/subject configuration
- Attendance monitoring
- Exam & results management
- Announcements & holidays

### Teacher
- My classes dashboard
- Mark attendance (with offline sync support)
- Enter marks for assigned subjects
- View assigned students
- Access announcements & holidays

### Parent
- Child selector (multiple children)
- Attendance overview with statistics
- Exam results viewing
- Announcements & holiday calendar
- Quick actions for common tasks

## API Integration

The web app communicates with the NestJS backend via:
- RESTful API endpoints
- JWT authentication with automatic token refresh
- Role-based access control
- Multi-tenant data isolation

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SchoolMS` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `http://localhost:3001` |

## Deployment

### Docker

```bash
# Build image
docker build -t school-web .

# Run container
docker run -p 3001:3001 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 school-web
```

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables
3. Deploy

## License

MIT