from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import BaseModel

class Tip(BaseModel):
    __tablename__ = "tips"
    
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100))
    tags = Column(JSONB)  # Array of tags
    trigger_conditions = Column(JSONB)  # Conditions for showing tip
    priority_score = Column(Integer, default=0)
    
class UserTip(BaseModel):
    __tablename__ = "user_tips"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tip_id = Column(UUID(as_uuid=True), ForeignKey("tips.id"))
    context_json = Column(JSONB)  # Why this tip was suggested
    status = Column(String(20), default="suggested")  # suggested, viewed, dismissed, helpful
    viewed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User")
    tip = relationship("Tip")
