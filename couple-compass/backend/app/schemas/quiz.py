from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class QuizOptionSchema(BaseModel):
    label: str = Field(..., description="The option text")
    value: str = Field(..., description="The option value (A, B, C, D)")
    points: int = Field(..., description="Points awarded for this option")

class QuizItemSchema(BaseModel):
    id: str
    prompt: str
    kind: str
    options: List[QuizOptionSchema]
    order_index: int
    category: str
    category_weight: float

class QuizCategorySchema(BaseModel):
    name: str
    display_name: str
    weight: float
    description: str
    icon: str

class QuizInterpretationSchema(BaseModel):
    min_score: float
    max_score: float
    level: str
    title: str
    description: str
    color: str

class QuizSchema(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    type: str
    is_active: bool
    categories: List[QuizCategorySchema]
    interpretation_ranges: List[QuizInterpretationSchema]
    items: List[QuizItemSchema]

class QuizAnswerSchema(BaseModel):
    question_id: str = Field(..., description="The ID of the question")
    answer: str = Field(..., description="The selected answer (A, B, C, D)")

class QuizSubmissionSchema(BaseModel):
    quiz_id: str = Field(..., description="The ID of the quiz")
    answers: List[QuizAnswerSchema] = Field(..., description="List of answers")

class CategoryScoreSchema(BaseModel):
    category: str
    display_name: str
    score: float
    percentage: float
    max_possible: int
    interpretation: str
    icon: str

class QuizInsightSchema(BaseModel):
    category: str
    insight_type: str  # strength, improvement, tip
    message: str
    recommendation: Optional[str] = None

class QuizResultSchema(BaseModel):
    id: str
    quiz_id: str
    user_id: str
    overall_score: float
    interpretation: str
    interpretation_details: QuizInterpretationSchema
    category_scores: List[CategoryScoreSchema]
    insights: List[QuizInsightSchema]
    comprehensive_insights: Optional[str] = None
    relationship_tips: Optional[List[Dict[str, str]]] = []
    responses: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class QuizAchievementSchema(BaseModel):
    id: str
    achievement_type: str
    title: str
    description: str
    icon: str
    earned_at: datetime
    achievement_data: Optional[Dict[str, Any]] = None

class QuizHistorySchema(BaseModel):
    results: List[QuizResultSchema]
    achievements: List[QuizAchievementSchema]
    stats: Dict[str, Any]

class QuizStatsSchema(BaseModel):
    total_quizzes: int
    average_score: float
    best_score: float
    improvement_trend: str
    streak_count: int
    category_averages: Dict[str, float]
