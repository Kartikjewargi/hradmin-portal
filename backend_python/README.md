# HR Payroll Portal - Python Backend

## Overview
This is the FastAPI backend for the HR Payroll Portal. It integrates the `payroll.py` engine for payroll calculations.

## Folder Structure

```
backend_python/
├── app.py                    # Main FastAPI application
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── hr_payroll.db            # SQLite database (created on first run)
├── uploads/                  # Uploaded Excel files
├── payslips/                 # Generated PDF payslips
├── auth/
│   ├── __init__.py
│   └── jwt_handler.py       # JWT authentication utilities
├── models/
│   ├── __init__.py
│   ├── database.py          # Database connection
│   ├── entities.py          # SQLAlchemy models
│   └── schemas.py           # Pydantic schemas
├── routes/
│   ├── __init__.py
│   ├── auth_routes.py       # Authentication endpoints
│   ├── hr_routes.py         # HR admin endpoints
│   └── employee_routes.py   # Employee endpoints
└── services/
    ├── __init__.py
    ├── payroll_agent.py     # Original payroll.py (DO NOT MODIFY)
    ├── payroll_service.py   # Wrapper service for PayrollAgent
    └── auth_service.py      # Authentication service
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend_python
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
# Development mode with auto-reload
python app.py

# OR using uvicorn directly
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access the API

- **API Base URL**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Default Credentials

### HR Admin
- **Email**: admin@company.com
- **Password**: admin123

### Employees
After payroll approval, employees can login with:
- **Email**: {emp_id}@company.com (or email from Excel)
- **Password**: {emp_id} (employee should change on first login)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (HR or Employee) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user info |

### HR Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-excel` | Upload salary Excel file |
| POST | `/api/set-policy` | Set payroll policy |
| GET | `/api/policy` | Get current policy |
| POST | `/api/generate-all` | Generate all payslips |
| POST | `/api/approve-payroll` | Approve payroll |
| GET | `/api/employees` | List all employees |
| GET | `/api/payslips` | List all payslips |
| GET | `/api/payslip/{emp_id}` | Get employee payslip |
| GET | `/api/payslip/{emp_id}/download` | Download payslip PDF |
| GET | `/api/batch` | Get current batch status |

### Employee Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employee/payslip` | Get own payslip |
| GET | `/api/employee/payslip/download` | Download own payslip PDF |
| GET | `/api/employee/profile` | Get own profile |

## Workflow

### HR Workflow
1. **Login** → POST `/api/auth/login`
2. **Upload Excel** → POST `/api/upload-excel`
3. **Set Policy** → POST `/api/set-policy`
4. **Generate Payroll** → POST `/api/generate-all`
5. **Approve Payroll** → POST `/api/approve-payroll`

### Employee Workflow (After Approval)
1. **Login** → POST `/api/auth/login`
2. **View Payslip** → GET `/api/employee/payslip`
3. **Download PDF** → GET `/api/employee/payslip/download`

## payroll.py Integration

The original `payroll.py` is integrated as follows:

1. **Location**: `services/payroll_agent.py`
2. **Usage**: `PayrollService` in `services/payroll_service.py` wraps `PayrollAgent`
3. **Calls to payroll.py**:
   - `load_uploaded_excel()` - When Excel is uploaded
   - `update_policy()` / `set_policies_direct()` - When policy is set
   - `calculate_payroll()` - For each employee calculation
   - `generate_payslip_pdf()` - To create PDF payslips
   - `generate_all_payslips()` - Bulk generation
   - `generate_single_payslip()` - Individual generation

**Important**: The internal logic of `payroll_agent.py` is unchanged from the original `payroll.py`.

## Database Schema

### Tables
- `users` - HR admins and employees
- `employees` - Employee details from Excel
- `payroll_batches` - Monthly payroll processing batches
- `payslips` - Individual payslip records
- `policies` - Payroll policy settings

## Security

- JWT token authentication
- Role-based access (HR / Employee)
- Employees cannot login until payroll is approved
- Employees can only access their own data
- HR can access all employee data
- Token expiry: 8 hours

## Environment Variables

Create a `.env` file for custom configuration:

```env
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=True
DEFAULT_HR_EMAIL=admin@company.com
DEFAULT_HR_PASSWORD=admin123
```
