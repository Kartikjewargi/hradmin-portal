"""
Employee Routes
================================================================================
These routes are for Employee operations:
- View own payroll summary
- Download own payslip PDF
================================================================================
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from models import get_db, User, PayrollStatus
from models.schemas import PayslipResponse, MessageResponse
from services import PayrollService
from auth import get_current_employee, get_current_user, require_hr_or_own_data
from models import UserRole

router = APIRouter(prefix="/api/employee", tags=["Employee Portal"])


@router.get("/payslip", response_model=PayslipResponse)
async def get_my_payslip(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Get current employee's payslip summary
    
    - Only accessible after payroll is approved
    - Employee can only view their own data
    """
    if not current_user.emp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID not found for this user"
        )
    
    payroll_service = PayrollService(db)
    payslip = payroll_service.get_employee_payslip(current_user.emp_id)
    
    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No approved payslip found"
        )
    
    return PayslipResponse.model_validate(payslip)


@router.get("/payslip/download")
async def download_my_payslip(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Download current employee's payslip PDF
    
    - Only accessible after payroll is approved
    - Employee can only download their own payslip
    """
    if not current_user.emp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID not found for this user"
        )
    
    payroll_service = PayrollService(db)
    payslip = payroll_service.get_employee_payslip(current_user.emp_id)
    
    if not payslip or not payslip.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip PDF not found"
        )
    
    pdf_path = payslip.pdf_path
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


@router.get("/profile")
async def get_my_profile(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Get current employee's profile information"""
    return {
        "id": current_user.id,
        "emp_id": current_user.emp_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value
    }


# ============ Shared Route (HR or Employee) ============

@router.get("/payslip/{emp_id}", response_model=PayslipResponse)
async def get_payslip_with_auth(
    emp_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get payslip for an employee
    
    - HR can access any employee's payslip
    - Employee can only access their own payslip
    """
    # Verify access rights
    require_hr_or_own_data(current_user, emp_id)
    
    # For employees, verify login permission
    if current_user.role == UserRole.EMPLOYEE and not current_user.can_login:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payroll not yet approved"
        )
    
    payroll_service = PayrollService(db)
    payslip = payroll_service.get_employee_payslip(emp_id)
    
    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip not found"
        )
    
    return PayslipResponse.model_validate(payslip)
