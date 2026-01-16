"""
HR Payroll Routes
================================================================================
These routes are for HR Admin operations:
- Upload Excel
- Set Policy
- Generate Payroll
- Approve Payroll
- View All Employees
- View Any Payslip
================================================================================
"""
import os
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from config import settings
from models import get_db, User, PayrollStatus
from models.schemas import (
    PolicyRequest, PolicyResponse, MessageResponse,
    UploadResponse, GeneratePayrollResponse, ApprovePayrollResponse,
    EmployeeListResponse, EmployeeResponse,
    PayslipListResponse, PayslipResponse,
    PayrollBatchResponse
)
from services import PayrollService
from auth import get_current_hr

router = APIRouter(prefix="/api", tags=["HR Payroll"])


# ============ Excel Upload ============

@router.post("/upload-excel", response_model=UploadResponse)
async def upload_excel(
    file: UploadFile = File(...),
    month: Optional[str] = Form(None),
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    Upload Excel file containing salary and attendance data
    
    - Only HR can access this endpoint
    - Accepts .xlsx or .xls files
    - Creates a new payroll batch
    
    >>> This endpoint calls PayrollService which uses payroll.py <<<
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx, .xls) are allowed"
        )
    
    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"upload_{timestamp}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Process with PayrollService
    # >>> PAYROLL.PY IS CALLED HERE via PayrollService <<<
    try:
        payroll_service = PayrollService(db)
        result = payroll_service.upload_excel(file_path, month)
        
        return UploadResponse(
            success=True,
            message=f"Successfully uploaded and processed {result['employees_count']} employees",
            employees_count=result['employees_count'],
            batch_id=result['batch_id']
        )
    except ValueError as e:
        # Clean up file on error
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Policy Settings ============

@router.post("/set-policy", response_model=PolicyResponse)
async def set_policy(
    policy: PolicyRequest,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    Set payroll policy settings
    
    - Only HR can access this endpoint
    - Supports both structured policy and text-based policy
    
    >>> This endpoint calls PayrollService which uses payroll.py <<<
    """
    # >>> PAYROLL.PY IS CALLED HERE via PayrollService <<<
    payroll_service = PayrollService(db)
    saved_policy = payroll_service.create_or_update_policy(policy.model_dump())
    
    return PolicyResponse.model_validate(saved_policy)


@router.get("/policy", response_model=PolicyResponse)
async def get_policy(
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Get current active policy"""
    payroll_service = PayrollService(db)
    policy = payroll_service.get_active_policy()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active policy found"
        )
    
    return PolicyResponse.model_validate(policy)


# ============ Generate Payroll ============

@router.post("/generate-all", response_model=GeneratePayrollResponse)
async def generate_all_payroll(
    batch_id: Optional[int] = None,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    Generate payroll for all employees
    
    - Only HR can access this endpoint
    - Creates payslip PDFs for all employees
    - Batch must be in DRAFT status
    
    >>> This endpoint calls PayrollService which uses payroll.py to generate payslips <<<
    """
    # >>> PAYROLL.PY IS CALLED HERE via PayrollService <<<
    payroll_service = PayrollService(db)
    
    # Use latest batch if not specified
    if not batch_id:
        batch = payroll_service.get_current_batch()
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No payroll batch found. Please upload Excel first."
            )
        batch_id = batch.id
    
    try:
        result = payroll_service.generate_all_payroll(batch_id)
        
        return GeneratePayrollResponse(
            success=True,
            message=f"Generated {result['payslips_generated']} payslips",
            payslips_generated=result['payslips_generated'],
            total_amount=result['total_amount']
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Approve Payroll ============

@router.post("/approve-payroll", response_model=ApprovePayrollResponse)
async def approve_payroll(
    batch_id: Optional[int] = None,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    Approve payroll batch
    
    - Only HR can access this endpoint
    - Enables employee login
    - Makes payslips visible to employees
    
    >>> This endpoint enables employee login after payroll approval <<<
    """
    payroll_service = PayrollService(db)
    
    # Use latest batch if not specified
    if not batch_id:
        batch = payroll_service.get_current_batch()
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No payroll batch found"
            )
        batch_id = batch.id
    
    try:
        result = payroll_service.approve_payroll(batch_id, current_user.id)
        
        return ApprovePayrollResponse(
            success=True,
            message=f"Payroll approved. {result['employees_enabled']} employees can now login.",
            employees_enabled=result['employees_enabled']
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Employees ============

@router.get("/employees", response_model=EmployeeListResponse)
async def list_employees(
    batch_id: Optional[int] = None,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    List all employees
    
    - Only HR can access this endpoint
    - Optionally filter by batch
    """
    payroll_service = PayrollService(db)
    employees = payroll_service.get_employees(batch_id)
    
    return EmployeeListResponse(
        employees=[EmployeeResponse.model_validate(e) for e in employees],
        total=len(employees)
    )


# ============ Payslips (HR View) ============

@router.get("/payslips", response_model=PayslipListResponse)
async def list_payslips(
    batch_id: Optional[int] = None,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    List all payslips
    
    - Only HR can access this endpoint
    - Optionally filter by batch
    """
    payroll_service = PayrollService(db)
    
    if not batch_id:
        batch = payroll_service.get_current_batch()
        batch_id = batch.id if batch else None
    
    payslips = payroll_service.get_payslips(batch_id)
    batch = payroll_service.get_batch_by_id(batch_id) if batch_id else None
    
    return PayslipListResponse(
        payslips=[PayslipResponse.model_validate(p) for p in payslips],
        total=len(payslips),
        batch_status=batch.status.value if batch else "unknown"
    )


@router.get("/payslip/{emp_id}", response_model=PayslipResponse)
async def get_payslip_by_emp_id(
    emp_id: str,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    Get payslip for a specific employee
    
    - Only HR can access this endpoint
    """
    payroll_service = PayrollService(db)
    payslips = payroll_service.get_payslips(emp_id=emp_id)
    
    if not payslips:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip not found"
        )
    
    # Return latest payslip
    return PayslipResponse.model_validate(payslips[-1])


@router.get("/payslip/{emp_id}/download")
async def download_payslip(
    emp_id: str,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """
    Download payslip PDF for a specific employee
    
    - Only HR can access this endpoint
    """
    payroll_service = PayrollService(db)
    payslips = payroll_service.get_payslips(emp_id=emp_id)
    
    if not payslips or not payslips[-1].pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip PDF not found"
        )
    
    pdf_path = payslips[-1].pdf_path
    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found on server"
        )
    
    return FileResponse(
        path=pdf_path,
        filename=os.path.basename(pdf_path),
        media_type="application/pdf"
    )


# ============ Batch Status ============

@router.get("/batch", response_model=PayrollBatchResponse)
async def get_current_batch(
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Get current payroll batch status"""
    payroll_service = PayrollService(db)
    batch = payroll_service.get_current_batch()
    
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payroll batch found"
        )
    
    return PayrollBatchResponse(
        id=batch.id,
        month=batch.month,
        status=batch.status.value,
        total_employees=batch.total_employees,
        total_amount=batch.total_amount,
        approved_at=batch.approved_at,
        created_at=batch.created_at
    )
