from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.quiz import Quiz, QuizItem, QuizResult, QuizAchievement
from ..schemas.quiz import (
    QuizSchema, QuizSubmissionSchema, QuizResultSchema, 
    QuizHistorySchema, QuizStatsSchema, QuizAchievementSchema
)
from ..services.quiz_scoring_service import QuizScoringService
from ..routers.auth import get_current_user_dependency as get_current_user

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.get("/relationship", response_model=QuizSchema)
async def get_relationship_quiz(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get the relationship evaluation quiz"""
    quiz = db.query(Quiz).filter(
        and_(Quiz.slug == "relationship-evaluation", Quiz.is_active == True)
    ).first()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship quiz not found"
        )
    
    # Get quiz items
    items = db.query(QuizItem).filter(
        QuizItem.quiz_id == quiz.id
    ).order_by(QuizItem.order_index).all()
    
    # Format response
    categories = []
    if quiz.categories_json:
        for category_key, category_data in quiz.categories_json.items():
            categories.append({
                "name": category_key,
                "display_name": category_data.get("display_name", category_key),
                "weight": category_data.get("weight", 0.25),
                "description": category_data.get("description", ""),
                "icon": category_data.get("icon", "📊")
            })
    
    interpretation_ranges = []
    if quiz.interpretation_ranges:
        for range_data in quiz.interpretation_ranges:
            interpretation_ranges.append({
                "min_score": range_data["min_score"],
                "max_score": range_data["max_score"], 
                "level": range_data["level"],
                "title": range_data["title"],
                "description": range_data["description"],
                "color": range_data["color"]
            })
    
    quiz_items = []
    for item in items:
        quiz_items.append({
            "id": str(item.id),
            "prompt": item.prompt,
            "kind": item.kind,
            "options": item.options_json or [],
            "order_index": item.order_index,
            "category": item.category,
            "category_weight": item.category_weight
        })
    
    return {
        "id": str(quiz.id),
        "slug": quiz.slug,
        "title": quiz.title,
        "description": quiz.description,
        "type": quiz.type,
        "is_active": quiz.is_active,
        "categories": categories,
        "interpretation_ranges": interpretation_ranges,
        "items": quiz_items
    }

@router.post("/relationship/submit", response_model=QuizResultSchema)
async def submit_relationship_quiz(
    submission: QuizSubmissionSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Submit relationship quiz answers and get results"""
    # Handle current_user as dict
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    # Get the quiz
    quiz = db.query(Quiz).filter(Quiz.id == submission.quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Validate all questions are answered
    quiz_items = db.query(QuizItem).filter(QuizItem.quiz_id == quiz.id).all()
    answered_questions = {answer.question_id for answer in submission.answers}
    required_questions = {str(item.id) for item in quiz_items}
    
    missing_questions = required_questions - answered_questions
    if missing_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing answers for questions: {', '.join(missing_questions)}"
        )
    
    # Calculate score using scoring service
    scoring_service = QuizScoringService(db)
    answers_data = [{"question_id": a.question_id, "answer": a.answer} for a in submission.answers]
    score_data = await scoring_service.calculate_quiz_score(quiz, answers_data)
    
    # Save results
    quiz_result = scoring_service.save_quiz_result(user_id, submission.quiz_id, score_data)
    
    # Format response
    category_scores = []
    for score in score_data['category_scores']:
        category_scores.append({
            "category": score['category'],
            "display_name": score['display_name'],
            "score": score['score'],
            "percentage": score['percentage'],
            "max_possible": score['max_possible'],
            "interpretation": score['interpretation'],
            "icon": score['icon']
        })
    
    insights = []
    for insight in score_data['insights']:
        insights.append({
            "category": insight['category'],
            "insight_type": insight['insight_type'],
            "message": insight['message'],
            "recommendation": insight.get('recommendation')
        })
    
    return {
        "id": str(quiz_result.id),
        "quiz_id": str(quiz_result.quiz_id),
        "user_id": str(quiz_result.user_id),
        "overall_score": quiz_result.overall_score,
        "interpretation": quiz_result.interpretation,
        "interpretation_details": score_data['interpretation_details'],
        "category_scores": category_scores,
        "insights": insights,
        "comprehensive_insights": score_data.get('comprehensive_insights', ''),
        "relationship_tips": score_data.get('relationship_tips', []),
        "responses": score_data['responses'],
        "created_at": quiz_result.created_at,
        "updated_at": quiz_result.updated_at
    }

@router.get("/relationship/results/{result_id}", response_model=QuizResultSchema)
async def get_quiz_result(
    result_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific quiz result"""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    quiz_result = db.query(QuizResult).filter(
        and_(QuizResult.id == result_id, QuizResult.user_id == user_id)
    ).first()
    
    if not quiz_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz result not found"
        )
    
    # Get interpretation details
    quiz = db.query(Quiz).filter(Quiz.id == quiz_result.quiz_id).first()
    interpretation_details = {"level": quiz_result.interpretation, "title": "Result", "description": "", "color": "#6b7280"}
    
    if quiz and quiz.interpretation_ranges:
        for range_data in quiz.interpretation_ranges:
            if (range_data["min_score"] <= quiz_result.overall_score <= range_data["max_score"]):
                interpretation_details = range_data
                break
    
    return {
        "id": str(quiz_result.id),
        "quiz_id": str(quiz_result.quiz_id),
        "user_id": str(quiz_result.user_id),
        "overall_score": quiz_result.overall_score,
        "interpretation": quiz_result.interpretation,
        "interpretation_details": interpretation_details,
        "category_scores": quiz_result.category_scores or [],
        "insights": quiz_result.insights or [],
        "responses": quiz_result.responses_json or {},
        "created_at": quiz_result.created_at,
        "updated_at": quiz_result.updated_at
    }

@router.get("/relationship/history", response_model=QuizHistorySchema)
async def get_quiz_history(
    limit: Optional[int] = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's quiz history with achievements"""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    # Get quiz results
    quiz_results = db.query(QuizResult).filter(
        QuizResult.user_id == user_id
    ).order_by(desc(QuizResult.created_at)).limit(limit).all()
    
    # Get achievements
    achievements = db.query(QuizAchievement).filter(
        QuizAchievement.user_id == user_id
    ).order_by(desc(QuizAchievement.created_at)).all()
    
    # Format results
    results = []
    for result in quiz_results:
        quiz = db.query(Quiz).filter(Quiz.id == result.quiz_id).first()
        interpretation_details = {"level": result.interpretation, "title": "Result", "description": "", "color": "#6b7280"}
        
        if quiz and quiz.interpretation_ranges:
            for range_data in quiz.interpretation_ranges:
                if (range_data["min_score"] <= result.overall_score <= range_data["max_score"]):
                    interpretation_details = range_data
                    break
        
        results.append({
            "id": str(result.id),
            "quiz_id": str(result.quiz_id),
            "user_id": str(result.user_id),
            "overall_score": result.overall_score,
            "interpretation": result.interpretation,
            "interpretation_details": interpretation_details,
            "category_scores": result.category_scores or [],
            "insights": result.insights or [],
            "responses": result.responses_json or {},
            "created_at": result.created_at,
            "updated_at": result.updated_at
        })
    
    # Format achievements
    achievement_list = []
    for achievement in achievements:
        achievement_data = achievement.achievement_data or {}
        achievement_list.append({
            "id": str(achievement.id),
            "achievement_type": achievement.achievement_type,
            "title": achievement_data.get("title", "Achievement"),
            "description": achievement_data.get("description", ""),
            "icon": achievement_data.get("icon", "🏆"),
            "earned_at": achievement.created_at,
            "achievement_data": achievement_data
        })
    
    # Calculate stats
    if quiz_results:
        scores = [r.overall_score for r in quiz_results]
        stats = {
            "total_quizzes": len(quiz_results),
            "average_score": sum(scores) / len(scores),
            "best_score": max(scores),
            "latest_score": quiz_results[0].overall_score,
            "improvement_trend": "stable"  # Could be calculated based on recent trends
        }
        
        # Calculate trend
        if len(quiz_results) >= 2:
            recent_avg = sum(scores[:3]) / min(3, len(scores))
            older_avg = sum(scores[3:6]) / min(3, len(scores[3:]))
            if len(scores) > 3:
                if recent_avg > older_avg + 5:
                    stats["improvement_trend"] = "improving"
                elif recent_avg < older_avg - 5:
                    stats["improvement_trend"] = "declining"
    else:
        stats = {
            "total_quizzes": 0,
            "average_score": 0.0,
            "best_score": 0.0,
            "latest_score": 0.0,
            "improvement_trend": "no_data"
        }
    
    return {
        "results": results,
        "achievements": achievement_list,
        "stats": stats
    }

@router.get("/relationship/stats", response_model=QuizStatsSchema) 
async def get_quiz_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive quiz statistics for the user"""
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    # Get all quiz results for this user
    quiz_results = db.query(QuizResult).filter(
        QuizResult.user_id == user_id
    ).order_by(desc(QuizResult.created_at)).all()
    
    if not quiz_results:
        return {
            "total_quizzes": 0,
            "average_score": 0.0,
            "best_score": 0.0,
            "improvement_trend": "no_data",
            "streak_count": 0,
            "category_averages": {}
        }
    
    scores = [r.overall_score for r in quiz_results]
    
    # Calculate category averages
    category_totals = {}
    category_counts = {}
    
    for result in quiz_results:
        if result.category_scores:
            for category_score in result.category_scores:
                category = category_score.get("category", "unknown")
                percentage = category_score.get("percentage", 0)
                
                if category not in category_totals:
                    category_totals[category] = 0
                    category_counts[category] = 0
                
                category_totals[category] += percentage
                category_counts[category] += 1
    
    category_averages = {}
    for category in category_totals:
        if category_counts[category] > 0:
            category_averages[category] = round(category_totals[category] / category_counts[category], 1)
    
    # Calculate improvement trend
    improvement_trend = "stable"
    if len(quiz_results) >= 2:
        recent_scores = scores[:3]
        older_scores = scores[3:6] if len(scores) > 3 else []
        
        if older_scores:
            recent_avg = sum(recent_scores) / len(recent_scores)
            older_avg = sum(older_scores) / len(older_scores)
            
            if recent_avg > older_avg + 5:
                improvement_trend = "improving"
            elif recent_avg < older_avg - 5:
                improvement_trend = "declining"
    
    # Calculate streak (consecutive quiz completions)
    streak_count = 0
    if quiz_results:
        # Simple streak calculation based on recent activity
        # In a real implementation, you might track this more precisely
        streak_count = min(len(quiz_results), 5)  # Cap at 5 for demo
    
    return {
        "total_quizzes": len(quiz_results),
        "average_score": round(sum(scores) / len(scores), 1),
        "best_score": max(scores),
        "improvement_trend": improvement_trend,
        "streak_count": streak_count,
        "category_averages": category_averages
    }
