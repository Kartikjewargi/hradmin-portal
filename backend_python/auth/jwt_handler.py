"""
JWT Authentication utilities and middleware
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import settings
from models import get_db, User, UserRole
from models.schemas import TokenData


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Truncate to 72 bytes for bcrypt limit
    truncated = plain_password[:72] if len(plain_password) > 72 else plain_password
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Truncate to 72 bytes for bcrypt limit
    truncated = password[:72] if len(password) > 72 else password
    return pwd_context.hash(truncated)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> TokenData:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing email"
            )
        return TokenData(email=email, role=role, user_id=user_id)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    token_data = decode_token(token)
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user


async def get_current_hr(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is HR"""
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. HR role required."
        )
    return current_user


async def get_current_employee(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is Employee and can login"""
    if current_user.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee role required."
        )
    
    if not current_user.can_login:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Payroll not yet approved."
        )
    
    return current_user


def require_hr_or_own_data(current_user: User, target_emp_id: str) -> bool:
    """Check if user can access the data - HR can access all, employees only their own"""
    if current_user.role == UserRole.HR:
        return True
    
    if current_user.role == UserRole.EMPLOYEE and current_user.emp_id == target_emp_id:
        return True
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. You can only view your own records."
    )
