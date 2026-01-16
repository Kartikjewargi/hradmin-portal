"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models import get_db
from models.schemas import LoginRequest, Token, MessageResponse, UserResponse
from services import AuthService
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint for both HR and Employees
    
    - HR can always login
    - Employees can only login after payroll is approved
    """
    auth_service = AuthService(db)
    token = auth_service.login(request.email, request.password)
    
    if not token:
        # Check if user exists but can't login
        user = auth_service.get_user_by_email(request.email)
        if user and not user.can_login:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Payroll not yet approved. Please wait for HR approval."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return token


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint (client should discard token)"""
    return MessageResponse(success=True, message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        emp_id=current_user.emp_id,
        can_login=current_user.can_login
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password"""
    auth_service = AuthService(db)
    success = auth_service.change_password(current_user.id, new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to change password"
        )
    
    return MessageResponse(success=True, message="Password changed successfully")
