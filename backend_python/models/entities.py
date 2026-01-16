"""
Database entity models for HR Payroll System
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from models.database import Base


class UserRole(enum.Enum):
    HR = "hr"
    EMPLOYEE = "employee"


class PayrollStatus(enum.Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    """User table for both HR and Employees"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    emp_id = Column(String(50), unique=True, nullable=True)  # Employee ID from Excel
    can_login = Column(Boolean, default=False)  # Employees can login only after approval
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payslips = relationship("Payslip", back_populates="user")


class Employee(Base):
    """Employee details from Excel upload"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    basic_da = Column(Float, default=0)
    hra = Column(Float, default=0)
    other_allowances = Column(Float, default=0)
    gross_salary = Column(Float, default=0)
    batch_id = Column(Integer, ForeignKey("payroll_batches.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    batch = relationship("PayrollBatch", back_populates="employees")
    payslips = relationship("Payslip", back_populates="employee")


class PayrollBatch(Base):
    """Payroll batch for each month's processing"""
    __tablename__ = "payroll_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    month = Column(String(50), nullable=False)  # e.g., "January 2026"
    excel_file_path = Column(String(500), nullable=True)
    status = Column(SQLEnum(PayrollStatus), default=PayrollStatus.DRAFT)
    total_employees = Column(Integer, default=0)
    total_amount = Column(Float, default=0)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = relationship("Employee", back_populates="batch")
    payslips = relationship("Payslip", back_populates="batch")
    approver = relationship("User", foreign_keys=[approved_by])


class Payslip(Base):
    """Individual payslip records"""
    __tablename__ = "payslips"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("payroll_batches.id"), nullable=False)
    
    emp_id = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=True)
    month = Column(String(50), nullable=False)
    
    # Attendance
    present_days = Column(Float, default=0)
    approved_paid_leaves = Column(Float, default=0)
    lop_days = Column(Float, default=0)
    payable_days = Column(Float, default=0)
    remaining_leaves = Column(Float, default=0)
    
    # Earnings
    basic_da = Column(Float, default=0)
    hra = Column(Float, default=0)
    other_allowances = Column(Float, default=0)
    gross = Column(Float, default=0)
    encashment = Column(Float, default=0)
    
    # Deductions
    pf = Column(Float, default=0)
    esi = Column(Float, default=0)
    pt = Column(Float, default=0)
    tds = Column(Float, default=0)
    total_deductions = Column(Float, default=0)
    
    # Net
    net_pay = Column(Float, default=0)
    
    # PDF
    pdf_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="payslips")
    employee = relationship("Employee", back_populates="payslips")
    batch = relationship("PayrollBatch", back_populates="payslips")


class Policy(Base):
    """Payroll policy settings"""
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    pf_rate = Column(Float, default=0.12)
    pf_cap = Column(Float, default=1800)
    esi_employee_rate = Column(Float, default=0.0075)
    esi_threshold = Column(Float, default=21000)
    pt_amount = Column(Float, default=200)
    leave_encashment = Column(Boolean, default=False)
    encash_max_days = Column(Integer, default=10)
    policy_text = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
