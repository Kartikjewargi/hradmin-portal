"""
HR Payroll Portal - FastAPI Backend Application
================================================================================

This is the main entry point for the HR Payroll Portal backend.
It integrates the payroll.py engine as a service and exposes it through APIs.

PAYROLL.PY INTEGRATION:
- payroll.py is copied to services/payroll_agent.py (unchanged logic)
- PayrollService wraps PayrollAgent for database integration
- All payroll calculations are done by the original payroll.py code

================================================================================
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from models import init_db, SessionLocal
from routes import auth_router, hr_router, employee_router
from services import AuthService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    print("=" * 60)
    print("HR Payroll Portal API Starting...")
    print("=" * 60)
    
    # Initialize database
    init_db()
    print("✓ Database initialized")
    
    # Create default HR admin if not exists
    db = SessionLocal()
    try:
        auth_service = AuthService(db)
        hr_user = auth_service.create_hr_admin(
            email=settings.DEFAULT_HR_EMAIL,
            password=settings.DEFAULT_HR_PASSWORD,
            name=settings.DEFAULT_HR_NAME
        )
        print(f"✓ Default HR Admin ready: {settings.DEFAULT_HR_EMAIL}")
    finally:
        db.close()
    
    print("=" * 60)
    print(f"API running at http://localhost:8000")
    print(f"Docs available at http://localhost:8000/docs")
    print("=" * 60)
    
    yield
    
    # Shutdown
    print("HR Payroll Portal API shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## HR Payroll Portal API
    
    This API provides backend services for the HR Admin Portal and Employee Portal.
    
    ### Features:
    - **HR Authentication** - JWT based login for HR admins
    - **Employee Authentication** - Login enabled after payroll approval
    - **Excel Upload** - Upload salary and attendance data
    - **Policy Management** - Configure PF, PT, ESI, leave encashment
    - **Payroll Generation** - Generate payslips using payroll engine
    - **Payroll Approval** - Approve payroll and enable employee access
    - **Payslip Access** - HR can view all, employees view their own
    
    ### Workflow:
    1. HR Login → Upload Excel → Set Policy → Generate Payroll → Approve
    2. After approval, employees can login and view/download their payslips
    
    ### Payroll Engine:
    This API uses the payroll.py engine (PayrollAgent) for all payroll calculations.
    The engine is wrapped by PayrollService for database integration.
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for payslips
app.mount("/payslips", StaticFiles(directory=settings.PAYSLIP_DIR), name="payslips")

# Include routers
app.include_router(auth_router)
app.include_router(hr_router)
app.include_router(employee_router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "HR Payroll Portal API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
