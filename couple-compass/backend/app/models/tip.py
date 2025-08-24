from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Tip(BaseModel):
    __tablename__ = "tips"
    
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100))
    tags = Column(JSON)  # Array of tags - using JSON for SQLite compatibility
    trigger_conditions = Column(JSON)  # Conditions for showing tip
    priority_score = Column(Integer, default=0)
    
class UserTip(BaseModel):
    __tablename__ = "user_tips"
    
    user_id = Column(Integer, ForeignKey("users.id"))  # Changed to Integer to match users table
    tip_id = Column(Integer, ForeignKey("tips.id"), nullable=True)  # Made nullable since we store content directly in context_json
    context_json = Column(JSON)  # Why this tip was suggested - using JSON for SQLite compatibility
    status = Column(String(20), default="suggested")  # suggested, viewed, dismissed, helpful
    viewed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User")
    tip = relationship("Tip")
