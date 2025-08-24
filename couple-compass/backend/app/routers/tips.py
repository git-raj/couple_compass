from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..schemas.tip import (
    TipResponse, TipsHistoryResponse, TipGenerateRequest, 
    TipViewRequest, TipViewResponse
)
from ..services.tips_service import TipsService
from ..routers.auth import get_current_user_dependency as get_current_user
from ..models.user import User

router = APIRouter(prefix="/tips", tags=["tips"])

@router.post("/generate", response_model=TipResponse)
async def generate_relationship_tip(
    request: TipGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new personalized relationship tip"""
    try:
        # Handle current_user as dict
        user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
        
        tips_service = TipsService()
        tip = await tips_service.generate_relationship_tip(
            db=db, 
            user_id=user_id
        )
        return tip
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate relationship tip"
        )

@router.get("/history", response_model=TipsHistoryResponse)
async def get_tips_history(
    limit: int = 5,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's recent relationship tips"""
    try:
        # Handle current_user as dict
        user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
        
        tips_service = TipsService()
        tips_history = tips_service.get_user_tips(
            db=db, 
            user_id=user_id, 
            limit=limit
        )
        return tips_history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tips history"
        )

@router.get("/latest", response_model=Optional[TipResponse])
async def get_latest_tip(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's most recent relationship tip"""
    try:
        # Handle current_user as dict
        user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
        
        tips_service = TipsService()
        latest_tip = tips_service.get_latest_tip(
            db=db, 
            user_id=user_id
        )
        return latest_tip
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve latest tip"
        )

@router.post("/view", response_model=TipViewResponse)
async def mark_tip_viewed(
    request: TipViewRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a tip as viewed"""
    try:
        # Handle current_user as dict
        user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
        
        tips_service = TipsService()
        success = await tips_service.mark_tip_viewed(
            db=db,
            user_id=user_id,
            tip_id=request.tip_id
        )
        
        if success:
            return TipViewResponse(
                success=True, 
                message="Tip marked as viewed"
            )
        else:
            return TipViewResponse(
                success=False, 
                message="Tip not found or already viewed"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark tip as viewed"
        )
