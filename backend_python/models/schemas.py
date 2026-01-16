"""
Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ============ Auth Schemas ============

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    emp_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    emp_id: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    emp_id: Optional[str] = None
    can_login: bool
    
    class Config:
        from_attributes = True


# ============ Policy Schemas ============

class PolicyRequest(BaseModel):
    policy_text: Optional[str] = None
    pf_rate: Optional[float] = 0.12
    pf_cap: Optional[float] = 1800
    esi_employee_rate: Optional[float] = 0.0075
    esi_threshold: Optional[float] = 21000
    pt_amount: Optional[float] = 200
    leave_encashment: Optional[bool] = False
    encash_max_days: Optional[int] = 10


class PolicyResponse(BaseModel):
    id: int
    pf_rate: float
    pf_cap: float
    esi_employee_rate: float
    esi_threshold: float
    pt_amount: float
    leave_encashment: bool
    encash_max_days: int
    policy_text: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============ Employee Schemas ============

class EmployeeResponse(BaseModel):
    id: int
    emp_id: str
    name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    basic_da: float
    hra: float
    other_allowances: float
    gross_salary: float
    
    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    employees: List[EmployeeResponse]
    total: int


# ============ Payroll Batch Schemas ============

class PayrollBatchResponse(BaseModel):
    id: int
    month: str
    status: str
    total_employees: int
    total_amount: float
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Payslip Schemas ============

class PayslipResponse(BaseModel):
    id: int
    emp_id: str
    name: str
    designation: Optional[str] = None
    month: str
    present_days: float
    approved_paid_leaves: float
    lop_days: float
    payable_days: float
    remaining_leaves: float
    basic_da: float
    hra: float
    other_allowances: float
    gross: float
    encashment: float
    pf: float
    esi: float
    pt: float
    tds: float
    total_deductions: float
    net_pay: float
    pdf_path: Optional[str] = None
    
    class Config:
        from_attributes = True


class PayslipListResponse(BaseModel):
    payslips: List[PayslipResponse]
    total: int
    batch_status: str


# ============ Generic Response Schemas ============

class MessageResponse(BaseModel):
    success: bool
    message: str


class UploadResponse(BaseModel):
    success: bool
    message: str
    employees_count: int
    batch_id: int


class GeneratePayrollResponse(BaseModel):
    success: bool
    message: str
    payslips_generated: int
    total_amount: float


class ApprovePayrollResponse(BaseModel):
    success: bool
    message: str
    employees_enabled: int
