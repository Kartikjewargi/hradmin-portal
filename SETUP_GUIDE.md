# HR Payroll Portal - Complete Setup Guide

This document provides complete setup and run instructions for the HR Payroll Portal.

## Project Overview

The project consists of:
1. **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
2. **Backend**: Python FastAPI + SQLite + JWT Authentication
3. **Payroll Engine**: payroll.py integrated as a service

## Quick Start

### Backend Setup (Python)

```bash
# Navigate to backend
cd backend_python

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend Setup

```bash
# In project root
cd hr-portal-main

# Install dependencies
npm install
# or
bun install

# Run dev server
npm run dev
# or
bun dev
```

Frontend runs at: http://localhost:5173

## Folder Structure

```
hr-portal-main/
├── backend_python/           # Python FastAPI Backend
│   ├── app.py               # Main FastAPI application
│   ├── config.py            # Configuration settings
│   ├── requirements.txt     # Python dependencies
│   ├── schema.sql          # Database schema reference
│   ├── README.md           # Backend documentation
│   ├── uploads/            # Uploaded Excel files
│   ├── payslips/           # Generated PDF payslips
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt_handler.py  # JWT authentication
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py     # Database connection
│   │   ├── entities.py     # SQLAlchemy models
│   │   └── schemas.py      # Pydantic schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py  # Authentication endpoints
│   │   ├── hr_routes.py    # HR admin endpoints
│   │   └── employee_routes.py  # Employee endpoints
│   └── services/
│       ├── __init__.py
│       ├── payroll_agent.py    # >>> ORIGINAL payroll.py <<<
│       ├── payroll_service.py  # Wrapper for payroll.py
│       └── auth_service.py     # Authentication service
│
├── src/                     # React Frontend
│   ├── pages/
│   │   ├── PayrollManagement.tsx  # HR Payroll workflow
│   │   ├── EmployeePayslip.tsx    # Employee payslip view
│   │   └── ...
│   └── services/
│       ├── apiConfig.ts    # HTTP client config
│       └── payrollApi.ts   # Payroll API calls
│
└── ...
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/logout` | Logout | Authenticated |
| GET | `/api/auth/me` | Get user info | Authenticated |

### HR Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/upload-excel` | Upload salary Excel | HR Only |
| POST | `/api/set-policy` | Set payroll policy | HR Only |
| GET | `/api/policy` | Get current policy | HR Only |
| POST | `/api/generate-all` | Generate all payslips | HR Only |
| POST | `/api/approve-payroll` | Approve payroll | HR Only |
| GET | `/api/employees` | List employees | HR Only |
| GET | `/api/payslips` | List all payslips | HR Only |
| GET | `/api/payslip/{emp_id}` | Get employee payslip | HR Only |
| GET | `/api/payslip/{emp_id}/download` | Download PDF | HR Only |
| GET | `/api/batch` | Get batch status | HR Only |

### Employee Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/employee/payslip` | Get own payslip | Employee Only |
| GET | `/api/employee/payslip/download` | Download own PDF | Employee Only |
| GET | `/api/employee/profile` | Get own profile | Employee Only |

## Workflow

### HR Workflow

1. **Login** as HR Admin
   - Email: admin@company.com
   - Password: admin123

2. **Upload Excel** with salary and attendance data
   - Salary sheet: Must contain columns like Name, Emp ID, Basic, HRA, etc.
   - Attendance sheet: Optional, sheet name must contain "atten"

3. **Set Policy** for payroll calculation
   - Configure PF rate, PT amount, leave encashment, etc.
   - Or use policy text: "Encash unused leaves up to 10 days. PT 250."

4. **Generate Payroll**
   - System calculates salaries using payroll.py engine
   - PDF payslips are generated for all employees

5. **Approve Payroll**
   - Review generated payslips
   - Click approve to enable employee access
   - Employee accounts are created automatically

### Employee Workflow

After HR approves payroll:

1. **Login** as Employee
   - Email: {emp_id}@company.com (or email from Excel)
   - Password: {emp_id} (first time)

2. **View Payslip** summary with all details

3. **Download PDF** payslip

## payroll.py Integration

The original `payroll.py` is integrated WITHOUT modification:

### Location
`backend_python/services/payroll_agent.py`

### How It's Used

```python
# In PayrollService (payroll_service.py)

from services.payroll_agent import PayrollAgent

class PayrollService:
    def __init__(self, db):
        # >>> PAYROLL.PY INSTANTIATION <<<
        self.agent = PayrollAgent(payslip_output_dir=settings.PAYSLIP_DIR)
    
    def upload_excel(self, file_path):
        # >>> PAYROLL.PY CALL <<<
        self.agent.load_uploaded_excel(file_path)
    
    def set_policy(self, policy):
        # >>> PAYROLL.PY CALL <<<
        self.agent.update_policy(policy.policy_text)
        self.agent.set_policies_direct({...})
    
    def generate_payroll(self):
        # >>> PAYROLL.PY CALL <<<
        results = self.agent.generate_all_payslips()
```

### Key Methods from payroll.py

| Method | Purpose | Called From |
|--------|---------|-------------|
| `load_uploaded_excel()` | Load Excel data | `/api/upload-excel` |
| `update_policy()` | Parse policy text | `/api/set-policy` |
| `set_policies_direct()` | Set policy values | `/api/set-policy` |
| `calculate_payroll()` | Calculate one employee | Internal |
| `generate_payslip_pdf()` | Create PDF | Internal |
| `generate_all_payslips()` | Process all | `/api/generate-all` |
| `generate_single_payslip()` | Process one | `/api/payslip/{id}` |

## Security

### Authentication
- JWT (JSON Web Token) based
- Token expires in 8 hours
- Stored in localStorage on frontend

### Authorization
- HR can access all endpoints
- Employees can only access their own data
- Employees cannot login until payroll is approved

### Role Checks
```python
# HR only endpoint
@router.post("/upload-excel")
async def upload(current_user: User = Depends(get_current_hr)):
    ...

# Employee only endpoint
@router.get("/employee/payslip")
async def my_payslip(current_user: User = Depends(get_current_employee)):
    ...
```

## Excel File Format

The payroll.py engine accepts flexible Excel formats:

### Salary Sheet (Required)
Must contain columns matching (case-insensitive):
- Name, Emp ID/Code/E.Code
- Basic/Basic+DA, HRA
- Other Allow/Allowance
- Gross/Monthly Gross/CTC
- TDS (optional)

### Attendance Sheet (Optional)
Sheet name must contain "atten":
- Employee identifier matching salary sheet
- Present days, Paid leaves, LOP days
- Remaining leave balance

## Environment Variables

Create `.env` in `backend_python/`:

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
DEFAULT_HR_EMAIL=admin@company.com
DEFAULT_HR_PASSWORD=your-secure-password
DATABASE_URL=sqlite:///./hr_payroll.db
```

For frontend, create `.env` in project root:

```env
VITE_API_URL=http://localhost:8000
```

## Production Deployment

### Backend
```bash
# Use gunicorn with uvicorn worker
pip install gunicorn

gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Frontend
```bash
# Build for production
npm run build

# Serve with any static file server
npx serve dist
```

## Troubleshooting

### CORS Errors
Ensure backend CORS settings include your frontend URL in `app.py`

### Database Issues
Delete `hr_payroll.db` and restart to recreate tables

### Excel Upload Fails
- Ensure file is .xlsx or .xls
- Check for salary-related column names
- Ensure no completely empty rows

### Employee Can't Login
- Check if payroll is approved
- Verify employee ID matches Excel
- Default password is employee ID
