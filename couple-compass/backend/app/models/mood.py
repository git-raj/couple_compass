from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import BaseModel

class MoodCheckin(BaseModel):
    __tablename__ = "mood_checkins"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"))
    mood_level = Column(Integer, nullable=False)  # 1-5 scale
    notes = Column(Text)
    context_tags = Column(JSONB)  # Optional mood context tags
    
    # Relationships
    user = relationship("User", back_populates="mood_checkins")
    couple = relationship("Couple", back_populates="mood_checkins")

class Journal(BaseModel):
    __tablename__ = "journals"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"))
    content = Column(Text, nullable=False)
    visibility = Column(String(20), default="private")  # private, shared
    sentiment_score = Column(Integer)  # AI-analyzed sentiment
    themes = Column(JSONB)  # AI-extracted themes
    
    # Relationships
    user = relationship("User", back_populates="journals")
    couple = relationship("Couple", back_populates="journals")

class VoiceNote(BaseModel):
    __tablename__ = "voice_notes"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    s3_url = Column(Text, nullable=False)
    transcript = Column(Text)
    duration_seconds = Column(Integer)
    visibility = Column(String(20), default="private")
    
    # Relationships
    user = relationship("User")
