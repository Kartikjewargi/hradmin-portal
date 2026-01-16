"""Routes package"""
from routes.auth_routes import router as auth_router
from routes.hr_routes import router as hr_router
from routes.employee_routes import router as employee_router

__all__ = [
    "auth_router",
    "hr_router",
    "employee_router",
]
