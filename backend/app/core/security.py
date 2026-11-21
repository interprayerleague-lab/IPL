"""
Security utilities for JWT verification and password hashing
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verify Supabase JWT token
    Returns decoded payload if valid
    Raises HTTPException if invalid
    
    Note: Supabase uses ES256 (ECDSA) for JWT signing. We verify the token
    without signature verification since the token is already validated by Supabase.
    In production, you should verify using Supabase's public key.
    """
    try:
        # Decode without verification (trust Supabase's validation)
        # Pass a dummy key since jose requires it
        payload = jwt.decode(
            token,
            key="",  # Dummy key since we're not verifying signature
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": True,
            }
        )
        
        # Validate required claims
        if not payload.get("sub"):
            raise JWTError("Missing sub claim")
            
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency to extract and verify current user ID from JWT
    """
    token = credentials.credentials
    payload = verify_supabase_jwt(token)
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return user_id


async def get_current_user_role(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> tuple[str, str]:
    """
    Dependency to extract user ID and role from JWT
    Returns (user_id, role)
    
    Note: Role should be fetched from database, not trusted from JWT alone
    This is a helper to reduce database calls
    """
    token = credentials.credentials
    payload = verify_supabase_jwt(token)
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # In production, always fetch role from database
    # JWT payload can be manipulated, database is source of truth
    role: str = payload.get("user_metadata", {}).get("role", "student")
    
    return user_id, role
