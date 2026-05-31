from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.core.database import get_supabase
from app.core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterBody(BaseModel):
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user: dict | None = None
    session: dict | None = None

@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterBody):
    db = get_supabase()
    try:
        res = db.auth.sign_up({"email": body.email, "password": body.password})
        return AuthResponse(
            user=res.user.model_dump() if res.user else None,
            session=res.session.model_dump() if res.session else None,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponse)
async def login(body: LoginBody):
    db = get_supabase()
    try:
        res = db.auth.sign_in_with_password({"email": body.email, "password": body.password})
        return AuthResponse(
            user=res.user.model_dump() if res.user else None,
            session=res.session.model_dump() if res.session else None,
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    db = get_supabase()
    try:
        db.auth.sign_out()
    except Exception:
        pass
    return {"message": "Logged out"}

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user
