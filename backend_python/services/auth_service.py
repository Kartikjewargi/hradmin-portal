"""
Authentication Service
"""
from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session

from config import settings
from models import User, UserRole
from auth import verify_password, get_password_hash, create_access_token
from models.schemas import Token


class AuthService:
    """Authentication service for HR and Employee login"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    
    def login(self, email: str, password: str) -> Optional[Token]:
        """Login and return JWT token"""
        user = self.authenticate_user(email, password)
        if not user:
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        # Create access token
        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": user.role.value,
                "user_id": user.id
            },
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user.role.value,
            name=user.name,
            emp_id=user.emp_id
        )
    
    def create_hr_admin(self, email: str, password: str, name: str) -> User:
        """Create HR admin user"""
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            return existing
        
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            name=name,
            role=UserRole.HR,
            can_login=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_emp_id(self, emp_id: str) -> Optional[User]:
        """Get user by employee ID"""
        return self.db.query(User).filter(User.emp_id == emp_id).first()
    
    def change_password(self, user_id: int, new_password: str) -> bool:
        """Change user password"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.password_hash = get_password_hash(new_password)
        self.db.commit()
        return True
