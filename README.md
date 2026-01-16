# HR Admin Portal with Payroll Management

A full-stack HR management application with payroll processing, employee management, and role-based access control.

## Tech Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

**Backend:**
- Python FastAPI
- SQLite + SQLAlchemy
- JWT Authentication

---

## Prerequisites

Before running this project, make sure you have installed:

1. **Python 3.10+** - Download from https://www.python.org/downloads/
2. **Node.js 18+** - Download from https://nodejs.org/

---

## Quick Start (After Cloning from GitHub)

### Step 1: Clone the Repository

```bash
git clone https://github.com/kartikjewargi/hradmin-portal.git
cd hradmin-portal
```

### Step 2: Setup Backend (Python)

```bash
# Navigate to backend folder
cd backend_python

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
python -m uvicorn app:app --reload --port 8000
```

The backend will run at **http://localhost:8000**
- API Documentation: http://localhost:8000/docs

### Step 3: Setup Frontend (React)

Open a **new terminal** and run:

```bash
# Navigate to project root
cd hradmin-portal

# Install Node.js dependencies
npm install

# Run the frontend development server
npm run dev
```

The frontend will run at **http://localhost:5173**

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| HR Admin | admin@company.com | admin123 |
| Employee | {emp_id}@company.com | {emp_id} |

> **Note:** Employee data is managed through a separate attendance backend integration.

---

## Features

### HR Admin Portal
- Upload employee Excel file
- Set payroll policies (tax rates, allowances, deductions)
- Generate payslips for all employees
- Preview payslips in PDF format before approval
- Approve or reject individual payslips
- View employee list and payroll history

### Employee Portal
- View personal payslip (after HR approval)
- Download payslip as PDF

---

## Project Structure

```
hradmin-portal/
├── src/                    # React Frontend
│   ├── components/         # UI Components
│   ├── pages/              # Page Components
│   ├── services/           # API Services
│   └── contexts/           # Auth Context
├── backend_python/         # Python FastAPI Backend
│   ├── app.py              # Main FastAPI App
│   ├── routes/             # API Routes
│   ├── services/           # Business Logic
│   ├── models/             # Database Models
│   └── auth/               # JWT Authentication
└── backend/                # (Legacy TypeScript Backend)
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Login | No |
| POST | /api/upload-excel | Upload employee Excel | HR |
| POST | /api/set-policy | Set payroll policy | HR |
| POST | /api/generate-all | Generate all payslips | HR |
| POST | /api/approve-payroll | Approve payroll batch | HR |
| GET | /api/payslips | Get all payslips | HR |
| GET | /api/employee/payslip | Get employee's payslip | Employee |
| GET | /api/employee/payslip/download | Download payslip PDF | Employee |

---

## Troubleshooting

**Backend won't start:**
- Make sure Python 3.10+ is installed
- Make sure all dependencies are installed: `pip install -r requirements.txt`

**Frontend won't start:**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

**Can't login:**
- Make sure backend is running on port 8000
- Check browser console for CORS errors

---

## License

MIT


