from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class MoodLevel(int, Enum):
    VERY_UNHAPPY = 1
    UNHAPPY = 2
    NEUTRAL = 3
    HAPPY = 4
    VERY_HAPPY = 5

class MoodCheckinCreate(BaseModel):
    mood_level: int  # 1-5 scale to match existing model
    notes: Optional[str] = None
    context_tags: Optional[Dict[str, Any]] = None

class MoodCheckinResponse(BaseModel):
    id: int
    user_id: str
    couple_id: Optional[str]
    mood_level: int
    notes: Optional[str]
    context_tags: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MoodStats(BaseModel):
    average_mood: float
    total_entries: int
    mood_distribution: Dict[int, int]  # mood_level -> count
    recent_trend: str  # "improving", "declining", "stable"

class MoodHistory(BaseModel):
    mood_checkins: List[MoodCheckinResponse]
    stats: MoodStats
