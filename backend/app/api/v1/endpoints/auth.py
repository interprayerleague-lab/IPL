"""
Authentication endpoints
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    MessageResponse
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user_id


router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Register a new user with email/password. User is created with 'student' role by default."
)
async def register(data: UserRegisterRequest):
    """
    Register a new user account
    
    - **email**: Valid email address (will be verified)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, number)
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **phone**: Optional phone number
    
    Returns access token and user profile.
    """
    return await AuthService.register_user(data)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login user",
    description="Authenticate user with email and password"
)
async def login(data: UserLoginRequest):
    """
    Login with email and password
    
    Returns access token, refresh token, and user profile.
    """
    return await AuthService.login_user(data)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
    description="Revoke current session"
)
async def logout(user_id: str = Depends(get_current_user_id)):
    """
    Logout current user (revoke session)
    
    Requires valid access token in Authorization header.
    """
    result = await AuthService.logout_user(user_id)
    return MessageResponse(message=result["message"])


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh access token",
    description="Get new access token using refresh token"
)
async def refresh_token(data: RefreshTokenRequest):
    """
    Refresh access token
    
    - **refresh_token**: Valid refresh token
    
    Returns new access token and refresh token.
    """
    return await AuthService.refresh_access_token(data.refresh_token)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request password reset",
    description="Send password reset email"
)
async def forgot_password(data: PasswordResetRequest):
    """
    Request password reset email
    
    - **email**: User's email address
    
    Always returns success message to prevent email enumeration.
    """
    result = await AuthService.request_password_reset(data.email)
    return MessageResponse(message=result["message"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get current authenticated user's profile"
)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Get current user profile
    
    Requires valid access token in Authorization header.
    """
    return await AuthService.get_user_by_id(user_id)


@router.get(
    "/verify",
    response_model=MessageResponse,
    summary="Verify token",
    description="Verify if access token is valid"
)
async def verify_token(user_id: str = Depends(get_current_user_id)):
    """
    Verify access token
    
    Returns success if token is valid.
    """
    return MessageResponse(
        message="Token is valid",
        detail=f"Authenticated as user: {user_id}"
    )
