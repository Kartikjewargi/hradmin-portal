"""
Configuration settings for the HR Payroll Backend
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "HR Payroll Portal API"
    DEBUG: bool = True
    
    # JWT Settings
    SECRET_KEY: str = "hr-payroll-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./hr_payroll.db"
    
    # Paths
    UPLOAD_DIR: str = "uploads"
    PAYSLIP_DIR: str = "payslips"
    
    # Default HR Admin (created on first run)
    DEFAULT_HR_EMAIL: str = "admin@company.com"
    DEFAULT_HR_PASSWORD: str = "admin123"
    DEFAULT_HR_NAME: str = "HR Administrator"
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PAYSLIP_DIR, exist_ok=True)
