"""
Original Payroll Agent - Copied from payroll.py
================================================================================
This file is a direct copy of the HR-provided payroll.py
DO NOT MODIFY the internal logic of this file.
It is used as a service by the PayrollService wrapper.
================================================================================
"""
import pandas as pd
import os
from fpdf import FPDF
from datetime import datetime
import re

class PayrollAgent:
    """
    Final Minimal Payroll Agent - No CSV Storage
    Works with any uploaded Excel, full features
    """

    def __init__(self, payslip_output_dir='payslips'):
        self.payslip_dir = payslip_output_dir
        self.data = {}  # Only in-memory
        self.policies = {
            'pf_rate': 0.12,
            'pf_cap': 1800,
            'esi_employee_rate': 0.0075,
            'esi_threshold': 21000,
            'pt_amount': 200,
            'leave_encashment': False,
            'encash_max_days': 10
        }
        
        os.makedirs(self.payslip_dir, exist_ok=True)

    def load_uploaded_excel(self, uploaded_excel_path: str):
        """HR uploads Excel → loaded directly into memory (no CSV saved)"""
        try:
            xls = pd.ExcelFile(uploaded_excel_path)

            salary_df = None
            attendance_df = None

            for sheet in xls.sheet_names:
                temp_df = pd.read_excel(xls, sheet_name=sheet, nrows=5)
                if any(col.lower() in ['basic', 'hra', 'gross', 'ctc', 'salary'] for col in temp_df.columns.str.lower()):
                    salary_df = pd.read_excel(xls, sheet_name=sheet)
                    salary_df = salary_df.dropna(how='all').reset_index(drop=True)

            for sheet in xls.sheet_names:
                if 'atten' in sheet.lower():
                    attendance_df = pd.read_excel(xls, sheet_name=sheet)
                    attendance_df = attendance_df.dropna(how='all').reset_index(drop=True)

            if salary_df is None:
                raise ValueError("No salary data found in uploaded file.")

            self.data['salary'] = salary_df
            self.data['attendance'] = attendance_df if attendance_df is not None else pd.DataFrame()

            print("Excel loaded successfully into memory (no CSV created).")
            return True
        except Exception as e:
            print(f"Error: {e}")
            return False

    def update_policy(self, policy_text: str):
        text = policy_text.lower()
        if any(w in text for w in ["encash", "leave encashment"]):
            self.policies['leave_encashment'] = True
        if "pt 250" in text:
            self.policies['pt_amount'] = 250
        pf_match = re.search(r'pf cap\s*(\d+)', text)
        if pf_match:
            self.policies['pf_cap'] = int(pf_match.group(1))
        print("Policy applied:", self.policies)

    def set_policies_direct(self, policies: dict):
        """Direct policy update from dictionary (added for API integration)"""
        for key, value in policies.items():
            if key in self.policies:
                self.policies[key] = value
        print("Policies set directly:", self.policies)

    def calculate_payroll(self, emp_row):
        # Flexible column detection
        def get(col_keywords, default=0):
            for col in emp_row.index:
                if any(k.lower() in str(col).lower() for k in col_keywords):
                    return emp_row[col]
            return default

        name = get(['name'])
        emp_id = get(['code', 'emp id', 'e.code', 'id'], 'Unknown')
        designation = get(['designation', 'role'])
        basic_da = float(get(['basic', 'basic + da'], 0))
        hra = float(get(['hra'], 0))
        other_allow = float(get(['other allow', 'allowance'], 0))
        gross_salary = float(get(['gross', 'monthly gross', 'ctc'], basic_da + hra + other_allow))
        days_in_month = int(get(['days in month', 'month days'], 31))
        tds = float(get(['tds'], 0))

        # Attendance
        present_days = days_in_month
        approved_paid_leaves = 0
        lop_days = 0
        remaining_leaves = 12

        if not self.data['attendance'].empty:
            att_match = self.data['attendance'][
                self.data['attendance'].apply(lambda r: str(emp_id).lower() in str(r.values).lower(), axis=1)
            ]
            if not att_match.empty:
                att = att_match.iloc[0]
                present_days = float(get(att, ['present', 'total present'], days_in_month))
                approved_paid_leaves = float(get(att, ['cl', 'el', 'paid leave'], 0))
                lop_days = float(get(att, ['lop'], 0))
                remaining_leaves = float(get(att, ['remaining', 'balance'], 12))

        payable_days = present_days + approved_paid_leaves
        prorated_gross = (gross_salary / days_in_month) * payable_days

        pf = min(basic_da * self.policies['pf_rate'], self.policies['pf_cap'])
        esi = prorated_gross * self.policies['esi_employee_rate'] if prorated_gross <= self.policies['esi_threshold'] else 0
        pt = self.policies['pt_amount'] if prorated_gross > 15000 else 0
        total_deductions = pf + esi + pt + tds

        encashment = 0
        if self.policies['leave_encashment'] and remaining_leaves > 0:
            encashment = ((basic_da + hra) / 30) * min(remaining_leaves, self.policies['encash_max_days'])

        net_pay = prorated_gross - total_deductions + encashment

        return {
            'emp_id': str(emp_id),
            'name': str(name),
            'designation': str(designation),
            'month': datetime.now().strftime("%B %Y"),
            'present_days': round(present_days, 1),
            'approved_paid_leaves': round(approved_paid_leaves, 1),
            'lop_days': round(lop_days, 1),
            'payable_days': round(payable_days, 1),
            'remaining_leaves': round(remaining_leaves, 1),
            'basic_da': round(basic_da, 2),
            'hra': round(hra, 2),
            'other_allow': round(other_allow, 2),
            'gross': round(prorated_gross, 2),
            'pf': round(pf, 2),
            'esi': round(esi, 2),
            'pt': round(pt, 2),
            'tds': round(tds, 2),
            'encashment': round(encashment, 2),
            'total_deductions': round(total_deductions, 2),
            'net_pay': round(net_pay, 2)
        }

    def generate_payslip_pdf(self, data):
        filename = f"payslip_{data['emp_id']}_{data['month'].replace(' ', '_')}.pdf"
        path = os.path.join(self.payslip_dir, filename)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'Salary Slip', ln=1, align='C')
        pdf.ln(10)
        
        pdf.set_font('Arial', '', 11)
        info = [
            f"Name: {data['name']}",
            f"ID: {data['emp_id']}",
            f"Month: {data['month']}",
            f"Present: {data['present_days']} | Paid Leaves: {data['approved_paid_leaves']} | LOP: {data['lop_days']}",
            f"Payable Days: {data['payable_days']}",
            "",
            f"Basic + DA: Rs.{data['basic_da']:,}",
            f"HRA: Rs.{data['hra']:,}",
            f"Other Allowances: Rs.{data['other_allow']:,}",
            f"Gross (Prorated): Rs.{data['gross']:,}",
            f"{'Leave Encashment: Rs.' + str(data['encashment']) + ',' if data['encashment'] > 0 else ''}",
            "",
            f"PF: Rs.{data['pf']:,} | ESI: Rs.{data['esi']:,} | PT: Rs.{data['pt']:,} | TDS: Rs.{data['tds']:,}",
            f"Total Deductions: Rs.{data['total_deductions']:,}",
            "",
            f"NET PAY: Rs.{data['net_pay']:,}"
        ]
        for line in info:
            if line:
                pdf.cell(0, 7, line, ln=1)
        
        pdf.output(path)
        return path

    def generate_all_payslips(self):
        """Generate payslips for all employees and return list of payroll data"""
        results = []
        for _, row in self.data['salary'].iterrows():
            payroll = self.calculate_payroll(row)
            pdf_path = self.generate_payslip_pdf(payroll)
            payroll['pdf_path'] = pdf_path
            results.append(payroll)
        return results

    def generate_single_payslip(self, emp_id):
        row = self.data['salary'][self.data['salary'].apply(lambda r: emp_id.lower() in str(r.values).lower(), axis=1)]
        if row.empty:
            raise ValueError("Employee not found")
        payroll = self.calculate_payroll(row.iloc[0])
        pdf_path = self.generate_payslip_pdf(payroll)
        payroll['pdf_path'] = pdf_path
        return payroll

    def get_salary_data(self):
        """Get the loaded salary dataframe"""
        return self.data.get('salary', pd.DataFrame())

    def get_employee_list(self):
        """Extract employee list from loaded data"""
        if 'salary' not in self.data or self.data['salary'].empty:
            return []
        
        employees = []
        for _, row in self.data['salary'].iterrows():
            def get(col_keywords, default=''):
                for col in row.index:
                    if any(k.lower() in str(col).lower() for k in col_keywords):
                        return row[col]
                return default
            
            employees.append({
                'emp_id': str(get(['code', 'emp id', 'e.code', 'id'], 'Unknown')),
                'name': str(get(['name'])),
                'designation': str(get(['designation', 'role'])),
                'department': str(get(['department', 'dept'])),
                'email': str(get(['email', 'mail'])),
                'basic_da': float(get(['basic', 'basic + da'], 0) or 0),
                'hra': float(get(['hra'], 0) or 0),
                'other_allowances': float(get(['other allow', 'allowance'], 0) or 0),
                'gross_salary': float(get(['gross', 'monthly gross', 'ctc'], 0) or 0),
            })
        
        return employees
