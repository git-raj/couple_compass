from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from typing import List, Optional

from ..database import get_db
from ..models.mood import MoodCheckin
from ..models.user import User
from ..schemas.mood import MoodCheckinCreate, MoodCheckinResponse, MoodStats
from ..routers.auth import get_current_user_dependency as get_current_user

router = APIRouter(prefix="/mood", tags=["mood"])

@router.post("/", response_model=MoodCheckinResponse)
async def create_mood_checkin(
    mood_data: MoodCheckinCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new mood check-in for the current user"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    # Check if user already has a mood entry for today
    today = datetime.now().date()
    existing_mood = db.query(MoodCheckin).filter(
        and_(
            MoodCheckin.user_id == user_id,
            func.date(MoodCheckin.created_at) == today
        )
    ).first()
    
    if existing_mood:
        # Update existing mood entry
        existing_mood.mood_level = mood_data.mood_level
        existing_mood.notes = mood_data.notes
        existing_mood.context_tags = mood_data.context_tags
        existing_mood.updated_at = datetime.now()
        db.commit()
        db.refresh(existing_mood)
        return existing_mood
    else:
        # Create new mood entry
        couple_id = current_user.get("couple_id") if isinstance(current_user, dict) else getattr(current_user, 'couple_id', None)
        db_mood = MoodCheckin(
            user_id=user_id,
            couple_id=couple_id,
            mood_level=mood_data.mood_level,
            notes=mood_data.notes,
            context_tags=mood_data.context_tags
        )
        db.add(db_mood)
        db.commit()
        db.refresh(db_mood)
        return db_mood

@router.get("/today", response_model=Optional[MoodCheckinResponse])
async def get_today_mood(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get today's mood check-in for the current user"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    today = datetime.now().date()
    mood = db.query(MoodCheckin).filter(
        and_(
            MoodCheckin.user_id == user_id,
            func.date(MoodCheckin.created_at) == today
        )
    ).first()
    return mood

@router.get("/history", response_model=List[MoodCheckinResponse])
async def get_mood_history(
    days: Optional[int] = 30,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get mood history for the current user"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    start_date = datetime.now() - timedelta(days=days)
    moods = db.query(MoodCheckin).filter(
        and_(
            MoodCheckin.user_id == user_id,
            MoodCheckin.created_at >= start_date
        )
    ).order_by(desc(MoodCheckin.created_at)).all()
    return moods

@router.get("/stats", response_model=MoodStats)
async def get_mood_stats(
    days: Optional[int] = 30,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get mood statistics for the current user"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    start_date = datetime.now() - timedelta(days=days)
    moods = db.query(MoodCheckin).filter(
        and_(
            MoodCheckin.user_id == user_id,
            MoodCheckin.created_at >= start_date
        )
    ).all()
    
    if not moods:
        return MoodStats(
            average_mood=0.0,
            total_entries=0,
            mood_distribution={},
            recent_trend="stable"
        )
    
    # Calculate average mood
    total_mood_value = sum(mood.mood_level for mood in moods)
    average_mood = total_mood_value / len(moods)
    
    # Calculate mood distribution
    mood_distribution = {}
    for level in range(1, 6):  # 1-5 scale
        count = sum(1 for mood in moods if mood.mood_level == level)
        mood_distribution[level] = count
    
    # Calculate recent trend (compare last 7 days with previous 7 days)
    recent_trend = "stable"
    if len(moods) >= 7:
        recent_moods = [mood for mood in moods if mood.created_at >= datetime.now() - timedelta(days=7)]
        previous_moods = [mood for mood in moods if mood.created_at >= datetime.now() - timedelta(days=14) and mood.created_at < datetime.now() - timedelta(days=7)]
        
        if recent_moods and previous_moods:
            recent_avg = sum(mood.mood_level for mood in recent_moods) / len(recent_moods)
            previous_avg = sum(mood.mood_level for mood in previous_moods) / len(previous_moods)
            
            if recent_avg > previous_avg + 0.3:
                recent_trend = "improving"
            elif recent_avg < previous_avg - 0.3:
                recent_trend = "declining"
    
    return MoodStats(
        average_mood=average_mood,
        total_entries=len(moods),
        mood_distribution=mood_distribution,
        recent_trend=recent_trend
    )

@router.get("/streak")
async def get_mood_streak(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get current mood streak for the current user"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    # Get all mood check-ins for this user ordered by date (most recent first)
    moods = db.query(MoodCheckin).filter(
        MoodCheckin.user_id == user_id
    ).order_by(desc(func.date(MoodCheckin.created_at))).all()
    
    if not moods:
        return {"current_streak": 0, "longest_streak": 0, "last_checkin": None}
    
    # Calculate current streak
    current_streak = 0
    today = datetime.now().date()
    
    # Group moods by date (in case there are multiple entries per day, we only count the day once)
    mood_dates = set()
    for mood in moods:
        mood_date = mood.created_at.date() if hasattr(mood.created_at, 'date') else mood.created_at
        mood_dates.add(mood_date)
    
    # Sort dates in descending order
    sorted_dates = sorted(mood_dates, reverse=True)
    
    # Check for current streak starting from today or yesterday
    check_date = today
    if sorted_dates and sorted_dates[0] == today:
        current_streak = 1
        check_date = today - timedelta(days=1)
    elif sorted_dates and sorted_dates[0] == today - timedelta(days=1):
        current_streak = 1
        check_date = today - timedelta(days=2)
    
    # Continue counting consecutive days
    for date in sorted_dates[1:] if current_streak > 0 else sorted_dates:
        if current_streak == 0 and date == today - timedelta(days=1):
            current_streak = 1
            check_date = today - timedelta(days=2)
            continue
        elif current_streak == 0:
            break
            
        if date == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    prev_date = None
    
    for date in sorted(sorted_dates):
        if prev_date is None:
            temp_streak = 1
        elif date == prev_date + timedelta(days=1):
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
        prev_date = date
    
    longest_streak = max(longest_streak, temp_streak)
    
    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_checkin": sorted_dates[0].isoformat() if sorted_dates else None
    }

@router.delete("/{mood_id}")
async def delete_mood_checkin(
    mood_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a mood check-in"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    mood = db.query(MoodCheckin).filter(
        and_(MoodCheckin.id == mood_id, MoodCheckin.user_id == user_id)
    ).first()
    
    if not mood:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood check-in not found"
        )
    
    db.delete(mood)
    db.commit()
    return {"message": "Mood check-in deleted successfully"}
