"""
FastAPI dependencies for authentication and authorization
"""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import verify_supabase_jwt
from app.core.database import supabase_admin


security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and verify user ID from JWT token
    """
    try:
        token = credentials.credentials
        payload = verify_supabase_jwt(token)
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials - no sub claim"
            )
        
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ JWT Verification Error: {str(e)}")
        print(f"   Token preview: {token[:50]}..." if len(token) > 50 else f"   Token: {token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def require_student(
    user_id: str = Depends(get_current_user_id)
) -> str:
    """
    Dependency that requires user to be authenticated as student
    Returns user_id if authorized
    """
    try:
        # Fetch user role from database (source of truth)
        response = supabase_admin.table("profiles").select("role").eq("id", user_id).single().execute()
        
        if not response.data:
            print(f"❌ Profile not found for user_id: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        role = response.data.get("role")
        print(f"✅ User {user_id[:8]}... has role: {role}")
        
        if role not in ["student", "admin"]:  # Admin can also access student routes
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student access required"
            )
        
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error checking student role: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying user role: {str(e)}"
        )


async def require_admin(
    user_id: str = Depends(get_current_user_id)
) -> str:
    """
    Dependency that requires user to be authenticated as admin
    Returns user_id if authorized
    """
    # Fetch user role from database (source of truth)
    response = supabase_admin.table("profiles").select("role").eq("id", user_id).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    role = response.data.get("role")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user_id


# Type aliases for cleaner dependency injection
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
StudentUserId = Annotated[str, Depends(require_student)]
AdminUserId = Annotated[str, Depends(require_admin)]
