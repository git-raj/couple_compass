from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import BaseModel

class Quiz(BaseModel):
    __tablename__ = "quizzes"
    
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # love_language, communication_style
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    
    # Relationships
    items = relationship("QuizItem", back_populates="quiz")
    results = relationship("QuizResult", back_populates="quiz")

class QuizItem(BaseModel):
    __tablename__ = "quiz_items"
    
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"))
    prompt = Column(Text, nullable=False)
    kind = Column(String(50), nullable=False)  # multiple_choice, scale, text
    options_json = Column(JSONB)  # Store options for multiple choice
    order_index = Column(Integer, default=0)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="items")

class QuizResult(BaseModel):
    __tablename__ = "quiz_results"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"))
    responses_json = Column(JSONB, nullable=False)  # User responses
    scores_json = Column(JSONB, nullable=False)     # Calculated scores
    
    # Relationships
    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("Quiz", back_populates="results")
