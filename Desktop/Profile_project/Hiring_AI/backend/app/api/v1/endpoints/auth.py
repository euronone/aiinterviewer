"""
Authentication endpoints — Register, Login, Logout, Token Refresh.
Uses Supabase Auth for user management + JWT for API access.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import jwt

from app.core.config import settings
from app.core.database import get_supabase
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter()
security = HTTPBearer()


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    """Register a new candidate or recruiter."""
    supabase = get_supabase()

    # Create user in Supabase Auth
    try:
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "name": data.name,
                    "phone": data.phone,
                    "role": data.role.value,
                }
            }
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    user_id = auth_response.user.id

    # Insert into users table
    supabase.table("users").insert({
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "role": data.role.value,
    }).execute()

    token = create_access_token(user_id, data.role.value)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=data.name,
            email=data.email,
            phone=data.phone,
            role=data.role,
            created_at=datetime.utcnow(),
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Login with email & password."""
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = auth_response.user
    user_data = supabase.table("users").select("*").eq("id", user.id).single().execute()
    profile = user_data.data

    token = create_access_token(user.id, profile["role"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            name=profile["name"],
            email=profile["email"],
            phone=profile.get("phone"),
            role=profile["role"],
            created_at=profile["created_at"],
        ),
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout current user."""
    # In a stateless JWT setup, client discards the token.
    # For extra security, add token to Redis blocklist.
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    supabase = get_supabase()
    user_data = supabase.table("users").select("*").eq("id", current_user["sub"]).single().execute()
    profile = user_data.data
    return UserResponse(**profile)
