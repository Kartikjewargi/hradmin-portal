# Backend Setup Guide

## Prerequisites
- Node.js 18+
- Supabase account (free tier available at https://supabase.com)

## Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Supabase

1. Create a new Supabase project at https://app.supabase.com
2. Go to **Settings** → **API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `Anon Public Key` → `SUPABASE_ANON_KEY`

3. Go to **SQL Editor** and run the contents of `schema.sql` to create tables:
   - Employees
   - Attendance
   - Leaves
   - Payslips
   - Notifications

4. (Optional) Go to **Storage** and create a new bucket called `payslips` for PDF files.

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key
```

### 4. Run Backend

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

Backend will listen on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (body: `{ email, password }`)
- `POST /api/auth/logout` - Logout

### Employees
- `GET /api/employees` - List all active employees
- `POST /api/employees` - Create new employee
- `PATCH /api/employees/{id}/deactivate` - Deactivate employee

### Attendance
- `GET /api/attendance/today` - Get today's attendance records

### Leaves
- `GET /api/leaves` - List all leave requests
- `POST /api/leaves/{id}/approve` - Approve leave request
- `POST /api/leaves/{id}/reject` - Reject leave request

### Payslips
- `GET /api/payslips` - List all payslips
- `GET /api/payslips/{id}/download` - Download PDF
- `POST /api/payslips/{id}/approve` - Approve payslip
- `POST /api/payslips/{id}/reject` - Reject payslip

### Notifications
- `GET /api/notifications` - List unread notifications
- `POST /api/notifications/{id}/mark-read` - Mark as read

## Database Schema

- **employees**: Employee records with status
- **attendance**: Daily attendance logs
- **leaves**: Leave request applications
- **payslips**: Payslip records with file storage references
- **notifications**: HR admin notifications with read status

All tables use UUID primary keys and timestamps for audit trails.
