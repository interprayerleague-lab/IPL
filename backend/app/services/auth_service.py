"""
Authentication service
Handles user registration, login, and profile creation
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from gotrue.errors import AuthApiError

from app.core.database import supabase_admin
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse


class AuthService:
    """Authentication service"""
    
    @staticmethod
    async def register_user(data: UserRegisterRequest) -> AuthResponse:
        """
        Register a new user
        
        Steps:
        1. Create auth user with Supabase Auth
        2. Create profile record with role='student' (default)
        3. Return auth tokens
        """
        try:
            # Create auth user
            auth_response = supabase_admin.auth.sign_up({
                "email": data.email,
                "password": data.password,
                "options": {
                    "data": {
                        "first_name": data.first_name,
                        "last_name": data.last_name,
                        "phone": data.phone
                    }
                }
            })
            
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user account"
                )
            
            user_id = auth_response.user.id
            
            # Create profile with student role (default)
            profile_data = {
                "id": user_id,
                "email": data.email,
                "first_name": data.first_name,
                "last_name": data.last_name,
                "phone": data.phone,
                "role": "student",  # CRITICAL: Default to student
                "is_active": True
            }
            
            profile_response = supabase_admin.table("profiles").insert(profile_data).execute()
            
            if not profile_response.data:
                # Rollback: delete auth user if profile creation fails
                supabase_admin.auth.admin.delete_user(user_id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile"
                )
            
            # Prepare user response
            profile = profile_response.data[0]
            user_response = UserResponse(
                id=profile["id"],
                email=profile["email"],
                first_name=profile["first_name"],
                last_name=profile["last_name"],
                role=profile["role"],
                phone=profile.get("phone"),
                avatar_path=profile.get("avatar_path"),
                is_active=profile["is_active"],
                created_at=profile["created_at"]
            )
            
            # Return auth response
            return AuthResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer",
                expires_in=auth_response.session.expires_in or 3600,
                user=user_response
            )
            
        except AuthApiError as e:
            # Handle Supabase Auth errors
            if "already registered" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {str(e)}"
            )
    
    @staticmethod
    async def login_user(data: UserLoginRequest) -> AuthResponse:
        """
        Login user with email and password
        """
        try:
            # Authenticate with Supabase
            auth_response = supabase_admin.auth.sign_in_with_password({
                "email": data.email,
                "password": data.password
            })
            
            if not auth_response.user or not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            user_id = auth_response.user.id
            
            # Fetch profile
            profile_response = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
            
            if not profile_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User profile not found"
                )
            
            profile = profile_response.data
            
            # Check if account is active
            if not profile.get("is_active", True):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is inactive. Please contact administrator."
                )
            
            # Prepare user response
            user_response = UserResponse(
                id=profile["id"],
                email=profile["email"],
                first_name=profile["first_name"],
                last_name=profile["last_name"],
                role=profile["role"],
                phone=profile.get("phone"),
                avatar_path=profile.get("avatar_path"),
                is_active=profile["is_active"],
                created_at=profile["created_at"]
            )
            
            # Return auth response
            return AuthResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer",
                expires_in=auth_response.session.expires_in or 3600,
                user=user_response
            )
            
        except AuthApiError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login failed: {str(e)}"
            )
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> UserResponse:
        """
        Get user profile by ID
        """
        try:
            profile_response = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
            
            if not profile_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            profile = profile_response.data
            
            return UserResponse(
                id=profile["id"],
                email=profile["email"],
                first_name=profile["first_name"],
                last_name=profile["last_name"],
                role=profile["role"],
                phone=profile.get("phone"),
                avatar_path=profile.get("avatar_path"),
                is_active=profile["is_active"],
                created_at=profile["created_at"]
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch user: {str(e)}"
            )
    
    @staticmethod
    async def logout_user(access_token: str) -> Dict[str, str]:
        """
        Logout user (revoke session)
        """
        try:
            # Sign out with Supabase
            supabase_admin.auth.sign_out(access_token)
            
            return {"message": "Logged out successfully"}
            
        except Exception as e:
            # Even if sign out fails, we consider it successful on client side
            return {"message": "Logged out successfully"}
    
    @staticmethod
    async def refresh_access_token(refresh_token: str) -> AuthResponse:
        """
        Refresh access token using refresh token
        """
        try:
            auth_response = supabase_admin.auth.refresh_session(refresh_token)
            
            if not auth_response.session or not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired refresh token"
                )
            
            user_id = auth_response.user.id
            
            # Fetch profile
            profile_response = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
            
            if not profile_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User profile not found"
                )
            
            profile = profile_response.data
            
            user_response = UserResponse(
                id=profile["id"],
                email=profile["email"],
                first_name=profile["first_name"],
                last_name=profile["last_name"],
                role=profile["role"],
                phone=profile.get("phone"),
                avatar_path=profile.get("avatar_path"),
                is_active=profile["is_active"],
                created_at=profile["created_at"]
            )
            
            return AuthResponse(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer",
                expires_in=auth_response.session.expires_in or 3600,
                user=user_response
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh token"
            )
    
    @staticmethod
    async def request_password_reset(email: str) -> Dict[str, str]:
        """
        Request password reset email
        """
        try:
            # Send password reset email via Supabase Auth
            supabase_admin.auth.reset_password_email(email)
            
            return {
                "message": "If an account exists with this email, a password reset link has been sent."
            }
            
        except Exception as e:
            # Always return success message to prevent email enumeration
            return {
                "message": "If an account exists with this email, a password reset link has been sent."
            }
