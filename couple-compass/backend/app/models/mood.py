from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class MoodCheckin(BaseModel):
    __tablename__ = "mood_checkins"
    
    user_id = Column(Integer, ForeignKey("users.id"))
    couple_id = Column(Integer, nullable=True)  # Remove foreign key constraint since couples table doesn't exist yet
    mood_level = Column(Integer, nullable=False)  # 1-5 scale
    notes = Column(Text)
    context_tags = Column(JSON)  # Use JSON instead of JSONB for SQLite compatibility
    
    # Relationships
    user = relationship("User", back_populates="mood_checkins")
    # couple = relationship("Couple", back_populates="mood_checkins")  # Commenting out until Couple model is implemented

class Journal(BaseModel):
    __tablename__ = "journals"
    
    user_id = Column(Integer, ForeignKey("users.id"))
    couple_id = Column(Integer, nullable=True)  # Remove foreign key constraint since couples table doesn't exist yet
    content = Column(Text, nullable=False)
    visibility = Column(String(20), default="private")  # private, shared
    sentiment_score = Column(Integer)  # AI-analyzed sentiment
    themes = Column(JSON)  # Use JSON instead of JSONB for SQLite compatibility
    
    # Relationships
    user = relationship("User", back_populates="journals")
    # couple = relationship("Couple", back_populates="journals")  # Commenting out until Couple model is implemented

class VoiceNote(BaseModel):
    __tablename__ = "voice_notes"
    
    user_id = Column(Integer, ForeignKey("users.id"))
    s3_url = Column(Text, nullable=False)
    transcript = Column(Text)
    duration_seconds = Column(Integer)
    visibility = Column(String(20), default="private")
    
    # Relationships
    user = relationship("User")
