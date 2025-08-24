from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import string

from ..database import get_db
from ..models.user import User
from ..schemas.partner import (
    PartnerCodeGenerate, PartnerCodeResponse, PartnerLinkRequest,
    PartnerStatusResponse, PartnerLinkResponse, PartnerUnlinkResponse,
    PartnerInfo
)
from ..routers.auth import get_current_user_dependency

router = APIRouter(prefix="/partner", tags=["partner"])
security = HTTPBearer()

def generate_partner_code() -> str:
    """Generate a unique 6-character alphanumeric code"""
    # Use alphanumeric characters excluding confusing ones (0, O, I, 1)
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('1', '')
    code = ''.join(secrets.choice(chars) for _ in range(6))
    return code

def is_code_expired(expires_at: datetime) -> bool:
    """Check if a code has expired"""
    return datetime.utcnow() > expires_at

@router.post("/generate-code", response_model=PartnerCodeResponse)
async def generate_code(
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Generate a new partner code for the current user"""
    
    # Get user from database
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user already has a partner
    if user.partner_id:
        raise HTTPException(status_code=400, detail="You are already linked with a partner")
    
    # Generate unique code (retry if collision occurs)
    max_attempts = 10
    for attempt in range(max_attempts):
        code = generate_partner_code()
        existing_code = db.query(User).filter(User.partner_code == code).first()
        if not existing_code:
            break
    else:
        raise HTTPException(status_code=500, detail="Unable to generate unique code. Please try again.")
    
    # Set expiration time (24 hours from now)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Update user with new code
    user.partner_code = code
    user.partner_code_expires_at = expires_at
    db.commit()
    
    return PartnerCodeResponse(
        code=code,
        expires_at=expires_at,
        message="Code generated successfully. Share this code with your partner to link your accounts."
    )

@router.post("/link", response_model=PartnerLinkResponse)
async def link_partner(
    request: PartnerLinkRequest,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Link with a partner using their code"""
    
    # Get current user from database
    current_user_db = db.query(User).filter(User.id == current_user["id"]).first()
    if not current_user_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user already has a partner
    if current_user_db.partner_id:
        raise HTTPException(status_code=400, detail="You are already linked with a partner")
    
    # Find user with the provided code
    partner_user = db.query(User).filter(User.partner_code == request.code).first()
    if not partner_user:
        raise HTTPException(status_code=404, detail="Invalid code")
    
    # Check if code has expired
    if not partner_user.partner_code_expires_at or is_code_expired(partner_user.partner_code_expires_at):
        raise HTTPException(status_code=400, detail="Code has expired")
    
    # Check if partner user already has a partner
    if partner_user.partner_id:
        raise HTTPException(status_code=400, detail="This user is already linked with another partner")
    
    # Prevent users from linking with themselves
    if partner_user.id == current_user_db.id:
        raise HTTPException(status_code=400, detail="You cannot link with yourself")
    
    # Create bidirectional partnership
    linking_time = datetime.utcnow()
    
    current_user_db.partner_id = partner_user.id
    current_user_db.partner_linked_at = linking_time
    
    partner_user.partner_id = current_user_db.id
    partner_user.partner_linked_at = linking_time
    partner_user.partner_code = None  # Clear the used code
    partner_user.partner_code_expires_at = None
    
    db.commit()
    
    # Return partner info
    partner_info = PartnerInfo(
        id=partner_user.id,
        name=partner_user.name,
        email=partner_user.email,
        linked_at=linking_time
    )
    
    return PartnerLinkResponse(
        success=True,
        message=f"Successfully linked with {partner_user.name}!",
        partner=partner_info
    )

@router.get("/status", response_model=PartnerStatusResponse)
async def get_partner_status(
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Get current user's partner status"""
    
    # Get user from database
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    response = PartnerStatusResponse(has_partner=False)
    
    # Check if user has a partner
    if user.partner_id and user.partner:
        partner_info = PartnerInfo(
            id=user.partner.id,
            name=user.partner.name,
            email=user.partner.email,
            linked_at=user.partner_linked_at
        )
        response.has_partner = True
        response.partner = partner_info
    
    # Check if user has an active code
    if user.partner_code and user.partner_code_expires_at:
        if not is_code_expired(user.partner_code_expires_at):
            response.active_code = user.partner_code
            response.active_code_expires_at = user.partner_code_expires_at
    
    return response

@router.delete("/unlink", response_model=PartnerUnlinkResponse)
async def unlink_partner(
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Unlink from current partner"""
    
    # Get user from database
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.partner_id:
        raise HTTPException(status_code=400, detail="You are not linked with any partner")
    
    # Get partner user
    partner = db.query(User).filter(User.id == user.partner_id).first()
    
    # Clear partnership for both users
    user.partner_id = None
    user.partner_linked_at = None
    
    if partner:
        partner.partner_id = None
        partner.partner_linked_at = None
    
    db.commit()
    
    return PartnerUnlinkResponse(
        success=True,
        message="Successfully unlinked from partner"
    )

@router.post("/regenerate-code", response_model=PartnerCodeResponse)
async def regenerate_code(
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Regenerate partner code (invalidates old code)"""
    
    # Get user from database
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user already has a partner
    if user.partner_id:
        raise HTTPException(status_code=400, detail="You are already linked with a partner")
    
    # Generate new unique code
    max_attempts = 10
    for attempt in range(max_attempts):
        code = generate_partner_code()
        existing_code = db.query(User).filter(User.partner_code == code).first()
        if not existing_code:
            break
    else:
        raise HTTPException(status_code=500, detail="Unable to generate unique code. Please try again.")
    
    # Set expiration time (24 hours from now)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Update user with new code (this invalidates any existing code)
    user.partner_code = code
    user.partner_code_expires_at = expires_at
    db.commit()
    
    return PartnerCodeResponse(
        code=code,
        expires_at=expires_at,
        message="New code generated successfully. Your previous code has been invalidated."
    )
