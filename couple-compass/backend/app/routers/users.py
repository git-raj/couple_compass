from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..utils.security import verify_token
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()

class ProfileUpdate(BaseModel):
    pronouns: Optional[str] = None
    birthdate: Optional[str] = None
    timezone: Optional[str] = None
    relationshipStatus: Optional[str] = None
    partnerName: Optional[str] = None
    anniversaryDate: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    pronouns: Optional[str] = None
    birthdate: Optional[str] = None
    timezone: Optional[str] = None
    relationship_status: Optional[str] = None
    partner_name: Optional[str] = None
    anniversary_date: Optional[str] = None
    onboarding_completed: bool = False
    created_at: datetime
    updated_at: datetime

async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from token"""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user_from_token)
):
    """Get user profile"""
    return ProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        pronouns=current_user.pronouns,
        birthdate=current_user.birthdate,
        timezone=current_user.timezone,
        relationship_status=current_user.relationship_status,
        partner_name=current_user.partner_name,
        anniversary_date=current_user.anniversary_date,
        onboarding_completed=current_user.onboarding_completed,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    # Update user fields if provided
    if profile_data.pronouns is not None:
        current_user.pronouns = profile_data.pronouns
    if profile_data.birthdate is not None:
        current_user.birthdate = profile_data.birthdate
    if profile_data.timezone is not None:
        current_user.timezone = profile_data.timezone
    if profile_data.relationshipStatus is not None:
        current_user.relationship_status = profile_data.relationshipStatus
    if profile_data.partnerName is not None:
        current_user.partner_name = profile_data.partnerName
    if profile_data.anniversaryDate is not None:
        current_user.anniversary_date = profile_data.anniversaryDate
    
    # Mark onboarding as completed
    current_user.onboarding_completed = True
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "onboarding_completed": current_user.onboarding_completed
        }
    }
