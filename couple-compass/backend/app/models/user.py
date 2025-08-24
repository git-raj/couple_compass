from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, func
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    auth_provider = Column(String(50), default="email")  # email, google, apple
    provider_id = Column(String(255))
    
    # Profile fields
    pronouns = Column(String(50))
    birthdate = Column(String(10))  # YYYY-MM-DD format
    timezone = Column(String(50), default="UTC")
    relationship_status = Column(String(50))
    partner_name = Column(String(255))
    anniversary_date = Column(String(10))  # YYYY-MM-DD format
    onboarding_completed = Column(Boolean, default=False)
    
    # Partner linking fields
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    partner_code = Column(String(6), unique=True, nullable=True)
    partner_code_expires_at = Column(DateTime, nullable=True)
    partner_linked_at = Column(DateTime, nullable=True)
    
    # Relationships
    mood_checkins = relationship("MoodCheckin", back_populates="user")
    journals = relationship("Journal", back_populates="user")
    quiz_results = relationship("QuizResult", back_populates="user")
    # chat_sessions = relationship("ChatSession", back_populates="user")  # Uncomment when ChatSession model is ready
    
    # Partner relationship (self-referential)
    partner = relationship("User", foreign_keys=[partner_id], remote_side="User.id")
