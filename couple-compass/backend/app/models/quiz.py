from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Quiz(BaseModel):
    __tablename__ = "quizzes"
    
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # relationship_evaluation, love_language, communication_style
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    categories_json = Column(JSON)  # Store category definitions and weights
    interpretation_ranges = Column(JSON)  # Score interpretation ranges
    
    # Relationships
    items = relationship("QuizItem", back_populates="quiz")
    results = relationship("QuizResult", back_populates="quiz")

class QuizItem(BaseModel):
    __tablename__ = "quiz_items"
    
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    prompt = Column(Text, nullable=False)
    kind = Column(String(50), nullable=False)  # multiple_choice, scale, text
    options_json = Column(JSON)  # Store options for multiple choice
    order_index = Column(Integer, default=0)
    category = Column(String(50))  # communication, trust_security, intimacy_affection, support_partnership
    category_weight = Column(Float, default=1.0)  # Weight for this question within category
    
    # Relationships
    quiz = relationship("Quiz", back_populates="items")

class QuizResult(BaseModel):
    __tablename__ = "quiz_results"
    
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    responses_json = Column(JSON, nullable=False)  # User responses
    scores_json = Column(JSON, nullable=False)     # Calculated scores
    overall_score = Column(Float)  # Overall relationship score (0-100)
    category_scores = Column(JSON)  # Individual category scores
    interpretation = Column(String(100))  # Strong, Stable, Strained, At-Risk
    insights = Column(JSON)  # Personalized insights and recommendations
    
    # Relationships
    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("Quiz", back_populates="results")

class QuizAchievement(BaseModel):
    __tablename__ = "quiz_achievements"
    
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_type = Column(String(50), nullable=False)  # first_quiz, high_score, improvement, etc.
    achievement_data = Column(JSON)  # Additional data about the achievement
    quiz_result_id = Column(Integer, ForeignKey("quiz_results.id"), nullable=True)
    
    # Relationships
    user = relationship("User")
    quiz_result = relationship("QuizResult")
