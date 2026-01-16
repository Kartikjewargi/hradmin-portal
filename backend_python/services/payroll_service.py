"""
Payroll Service - Wrapper around PayrollAgent
================================================================================
This service wraps the PayrollAgent (payroll.py) and provides database 
integration for the HR Portal APIs.

PAYROLL.PY INTEGRATION POINTS ARE MARKED WITH: >>> PAYROLL.PY CALL <<<
================================================================================
"""
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from config import settings
from models import (
    User, UserRole, Employee, PayrollBatch, PayrollStatus, Payslip, Policy
)
from auth import get_password_hash

# >>> PAYROLL.PY IMPORT <<<
from services.payroll_agent import PayrollAgent


class PayrollService:
    """
    Service layer that wraps PayrollAgent and handles database operations
    """
    
    def __init__(self, db: Session):
        self.db = db
        # >>> PAYROLL.PY INSTANTIATION <<<
        self.agent = PayrollAgent(payslip_output_dir=settings.PAYSLIP_DIR)
    
    def get_active_policy(self) -> Optional[Policy]:
        """Get the current active policy from database"""
        return self.db.query(Policy).filter(Policy.is_active == True).first()
    
    def create_or_update_policy(self, policy_data: dict) -> Policy:
        """Create or update policy settings"""
        # Deactivate existing policies
        self.db.query(Policy).update({Policy.is_active: False})
        
        # Create new policy
        policy = Policy(
            pf_rate=policy_data.get('pf_rate', 0.12),
            pf_cap=policy_data.get('pf_cap', 1800),
            esi_employee_rate=policy_data.get('esi_employee_rate', 0.0075),
            esi_threshold=policy_data.get('esi_threshold', 21000),
            pt_amount=policy_data.get('pt_amount', 200),
            leave_encashment=policy_data.get('leave_encashment', False),
            encash_max_days=policy_data.get('encash_max_days', 10),
            policy_text=policy_data.get('policy_text'),
            is_active=True
        )
        self.db.add(policy)
        self.db.commit()
        self.db.refresh(policy)
        
        # >>> PAYROLL.PY CALL - Apply policy to agent <<<
        self._apply_policy_to_agent(policy)
        
        return policy
    
    def _apply_policy_to_agent(self, policy: Policy):
        """Apply database policy to PayrollAgent"""
        # >>> PAYROLL.PY CALL <<<
        self.agent.set_policies_direct({
            'pf_rate': policy.pf_rate,
            'pf_cap': policy.pf_cap,
            'esi_employee_rate': policy.esi_employee_rate,
            'esi_threshold': policy.esi_threshold,
            'pt_amount': policy.pt_amount,
            'leave_encashment': policy.leave_encashment,
            'encash_max_days': policy.encash_max_days
        })
        
        # Also apply policy text if present
        if policy.policy_text:
            # >>> PAYROLL.PY CALL <<<
            self.agent.update_policy(policy.policy_text)
    
    def upload_excel(self, file_path: str, month: Optional[str] = None) -> Dict[str, Any]:
        """
        Process uploaded Excel file and create payroll batch
        """
        if month is None:
            month = datetime.now().strftime("%B %Y")
        
        # >>> PAYROLL.PY CALL - Load Excel into agent <<<
        success = self.agent.load_uploaded_excel(file_path)
        if not success:
            raise ValueError("Failed to load Excel file. Check format.")
        
        # Create payroll batch
        batch = PayrollBatch(
            month=month,
            excel_file_path=file_path,
            status=PayrollStatus.DRAFT
        )
        self.db.add(batch)
        self.db.commit()
        self.db.refresh(batch)
        
        # >>> PAYROLL.PY CALL - Get employee list from loaded data <<<
        employees_data = self.agent.get_employee_list()
        
        # Store employees in database
        for emp_data in employees_data:
            employee = Employee(
                emp_id=emp_data['emp_id'],
                name=emp_data['name'],
                designation=emp_data['designation'],
                department=emp_data['department'],
                email=emp_data['email'],
                basic_da=emp_data['basic_da'],
                hra=emp_data['hra'],
                other_allowances=emp_data['other_allowances'],
                gross_salary=emp_data['gross_salary'],
                batch_id=batch.id
            )
            self.db.add(employee)
        
        batch.total_employees = len(employees_data)
        self.db.commit()
        
        return {
            "batch_id": batch.id,
            "employees_count": len(employees_data),
            "month": month
        }
    
    def generate_all_payroll(self, batch_id: int) -> Dict[str, Any]:
        """
        Generate payroll for all employees in a batch
        """
        batch = self.db.query(PayrollBatch).filter(PayrollBatch.id == batch_id).first()
        if not batch:
            raise ValueError("Batch not found")
        
        if batch.status == PayrollStatus.APPROVED:
            raise ValueError("Batch already approved. Cannot regenerate.")
        
        # Load policy
        policy = self.get_active_policy()
        if policy:
            self._apply_policy_to_agent(policy)
        
        # Reload Excel if needed
        if batch.excel_file_path and os.path.exists(batch.excel_file_path):
            # >>> PAYROLL.PY CALL - Reload Excel <<<
            self.agent.load_uploaded_excel(batch.excel_file_path)
        
        # >>> PAYROLL.PY CALL - Generate all payslips <<<
        payroll_results = self.agent.generate_all_payslips()
        
        # Clear existing payslips for this batch
        self.db.query(Payslip).filter(Payslip.batch_id == batch_id).delete()
        
        total_amount = 0
        
        # Store payslips in database
        for result in payroll_results:
            employee = self.db.query(Employee).filter(
                Employee.emp_id == result['emp_id'],
                Employee.batch_id == batch_id
            ).first()
            
            if not employee:
                continue
            
            payslip = Payslip(
                employee_id=employee.id,
                batch_id=batch_id,
                emp_id=result['emp_id'],
                name=result['name'],
                designation=result['designation'],
                month=result['month'],
                present_days=result['present_days'],
                approved_paid_leaves=result['approved_paid_leaves'],
                lop_days=result['lop_days'],
                payable_days=result['payable_days'],
                remaining_leaves=result['remaining_leaves'],
                basic_da=result['basic_da'],
                hra=result['hra'],
                other_allowances=result['other_allow'],
                gross=result['gross'],
                encashment=result['encashment'],
                pf=result['pf'],
                esi=result['esi'],
                pt=result['pt'],
                tds=result['tds'],
                total_deductions=result['total_deductions'],
                net_pay=result['net_pay'],
                pdf_path=result.get('pdf_path')
            )
            self.db.add(payslip)
            total_amount += result['net_pay']
        
        batch.status = PayrollStatus.GENERATED
        batch.total_amount = total_amount
        self.db.commit()
        
        return {
            "payslips_generated": len(payroll_results),
            "total_amount": total_amount,
            "batch_id": batch_id
        }
    
    def approve_payroll(self, batch_id: int, approver_id: int) -> Dict[str, Any]:
        """
        Approve payroll batch and enable employee logins
        """
        batch = self.db.query(PayrollBatch).filter(PayrollBatch.id == batch_id).first()
        if not batch:
            raise ValueError("Batch not found")
        
        if batch.status != PayrollStatus.GENERATED:
            raise ValueError("Batch must be generated before approval")
        
        # Update batch status
        batch.status = PayrollStatus.APPROVED
        batch.approved_by = approver_id
        batch.approved_at = datetime.utcnow()
        
        # Get all employees in this batch
        employees = self.db.query(Employee).filter(Employee.batch_id == batch_id).all()
        enabled_count = 0
        
        for emp in employees:
            # Create or update user account for employee
            user = self.db.query(User).filter(User.emp_id == emp.emp_id).first()
            
            if not user:
                # Create new user account
                # Default password is emp_id (should be changed on first login)
                user = User(
                    email=emp.email if emp.email and '@' in str(emp.email) else f"{emp.emp_id.lower()}@company.com",
                    password_hash=get_password_hash(emp.emp_id),
                    name=emp.name,
                    role=UserRole.EMPLOYEE,
                    emp_id=emp.emp_id,
                    can_login=True
                )
                self.db.add(user)
            else:
                # Enable login for existing user
                user.can_login = True
            
            # Link payslip to user
            payslip = self.db.query(Payslip).filter(
                Payslip.emp_id == emp.emp_id,
                Payslip.batch_id == batch_id
            ).first()
            if payslip:
                payslip.user_id = user.id
            
            enabled_count += 1
        
        self.db.commit()
        
        return {
            "batch_id": batch_id,
            "employees_enabled": enabled_count,
            "approved_at": batch.approved_at.isoformat()
        }
    
    def get_employees(self, batch_id: Optional[int] = None) -> List[Employee]:
        """Get all employees, optionally filtered by batch"""
        query = self.db.query(Employee)
        if batch_id:
            query = query.filter(Employee.batch_id == batch_id)
        return query.all()
    
    def get_payslips(self, batch_id: Optional[int] = None, emp_id: Optional[str] = None) -> List[Payslip]:
        """Get payslips with optional filters"""
        query = self.db.query(Payslip)
        if batch_id:
            query = query.filter(Payslip.batch_id == batch_id)
        if emp_id:
            query = query.filter(Payslip.emp_id == emp_id)
        return query.all()
    
    def get_payslip_by_id(self, payslip_id: int) -> Optional[Payslip]:
        """Get a specific payslip"""
        return self.db.query(Payslip).filter(Payslip.id == payslip_id).first()
    
    def get_employee_payslip(self, emp_id: str) -> Optional[Payslip]:
        """Get the latest approved payslip for an employee"""
        return self.db.query(Payslip).join(PayrollBatch).filter(
            Payslip.emp_id == emp_id,
            PayrollBatch.status == PayrollStatus.APPROVED
        ).order_by(Payslip.created_at.desc()).first()
    
    def get_current_batch(self) -> Optional[PayrollBatch]:
        """Get the most recent payroll batch"""
        return self.db.query(PayrollBatch).order_by(
            PayrollBatch.created_at.desc()
        ).first()
    
    def get_batch_by_id(self, batch_id: int) -> Optional[PayrollBatch]:
        """Get a specific batch"""
        return self.db.query(PayrollBatch).filter(PayrollBatch.id == batch_id).first()
    
    def regenerate_single_payslip(self, emp_id: str, batch_id: int) -> Dict[str, Any]:
        """
        Regenerate a single employee's payslip
        """
        batch = self.get_batch_by_id(batch_id)
        if not batch or not batch.excel_file_path:
            raise ValueError("Batch not found or no Excel file")
        
        # Load policy
        policy = self.get_active_policy()
        if policy:
            self._apply_policy_to_agent(policy)
        
        # >>> PAYROLL.PY CALL - Reload Excel and generate single payslip <<<
        self.agent.load_uploaded_excel(batch.excel_file_path)
        result = self.agent.generate_single_payslip(emp_id)
        
        # Update database
        payslip = self.db.query(Payslip).filter(
            Payslip.emp_id == emp_id,
            Payslip.batch_id == batch_id
        ).first()
        
        if payslip:
            payslip.net_pay = result['net_pay']
            payslip.pdf_path = result.get('pdf_path')
            # Update other fields...
            self.db.commit()
        
        return result
