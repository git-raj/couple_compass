from typing import Dict, List, Any, Tuple
from sqlalchemy.orm import Session
from app.models.quiz import Quiz, QuizItem, QuizResult, QuizAchievement
from app.schemas.quiz import QuizSubmissionSchema, CategoryScoreSchema, QuizInsightSchema
from app.services.ai_service import create_ai_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class QuizScoringService:
    def __init__(self, db: Session):
        self.db = db
    
    async def calculate_quiz_score(self, quiz: Quiz, answers: List[Dict[str, str]]) -> Dict[str, Any]:
        """Calculate comprehensive quiz score with category breakdowns and insights"""
        
        # Get quiz items
        quiz_items = {str(item.id): item for item in quiz.items}
        categories = quiz.categories_json or {}
        
        # Initialize category scores
        category_totals = {}
        category_max_scores = {}
        category_questions = {}
        
        for category_name in categories.keys():
            category_totals[category_name] = 0
            category_max_scores[category_name] = 0
            category_questions[category_name] = []
        
        # Process each answer
        responses = {}
        for answer in answers:
            question_id = answer['question_id']
            selected_answer = answer['answer']
            
            if question_id not in quiz_items:
                continue
                
            quiz_item = quiz_items[question_id]
            category = quiz_item.category
            
            # Find the points for this answer
            points = 0
            for option in quiz_item.options_json:
                if option['value'] == selected_answer:
                    points = option['points']
                    break
            
            # Add to category totals
            if category in category_totals:
                category_totals[category] += points
                category_max_scores[category] += 4  # Max points per question
                category_questions[category].append({
                    'question_id': question_id,
                    'question': quiz_item.prompt,
                    'answer': selected_answer,
                    'points': points,
                    'max_points': 4
                })
            
            responses[question_id] = {
                'question': quiz_item.prompt,
                'answer': selected_answer,
                'points': points,
                'category': category
            }
        
        # Calculate category scores and percentages
        category_scores = []
        overall_weighted_score = 0
        
        for category_name, category_info in categories.items():
            if category_name in category_totals:
                total_points = category_totals[category_name]
                max_points = category_max_scores[category_name]
                percentage = (total_points / max_points * 100) if max_points > 0 else 0
                weight = category_info.get('weight', 0.25)
                weighted_contribution = percentage * weight
                
                # Determine category interpretation
                if percentage >= 85:
                    interpretation = "Excellent"
                elif percentage >= 70:
                    interpretation = "Good"
                elif percentage >= 55:
                    interpretation = "Needs Work"
                else:
                    interpretation = "Concerning"
                
                category_score = CategoryScoreSchema(
                    category=category_name,
                    display_name=category_info.get('display_name', category_name),
                    score=total_points,
                    percentage=round(percentage, 1),
                    max_possible=max_points,
                    interpretation=interpretation,
                    icon=category_info.get('icon', '📊')
                )
                
                category_scores.append(category_score)
                overall_weighted_score += weighted_contribution
        
        # Determine overall interpretation
        overall_score = round(overall_weighted_score, 1)
        interpretation_data = self._get_interpretation(quiz, overall_score)
        
        # Generate insights
        insights = self._generate_insights(category_scores, responses)
        
        # Generate comprehensive insights and tips using AI
        try:
            comprehensive_insights = await self._generate_comprehensive_insights(category_scores, overall_score, interpretation_data)
            relationship_tips = await self._generate_relationship_tips(category_scores, overall_score)
        except Exception as e:
            logger.error(f"Error generating AI insights/tips: {str(e)}")
            comprehensive_insights = self._get_fallback_insights(category_scores, overall_score, interpretation_data)
            relationship_tips = self._get_fallback_tips(category_scores)
        
        return {
            'overall_score': overall_score,
            'interpretation': interpretation_data['level'],
            'interpretation_details': interpretation_data,
            'category_scores': [score.dict() for score in category_scores],
            'insights': [insight.dict() for insight in insights],
            'comprehensive_insights': comprehensive_insights,
            'relationship_tips': relationship_tips,
            'responses': responses
        }
    
    def _get_interpretation(self, quiz: Quiz, score: float) -> Dict[str, Any]:
        """Get interpretation details based on score"""
        interpretation_ranges = quiz.interpretation_ranges or []
        
        for range_data in interpretation_ranges:
            if range_data['min_score'] <= score <= range_data['max_score']:
                return range_data
        
        # Default fallback
        return {
            'min_score': 0.0,
            'max_score': 100.0,
            'level': 'unknown',
            'title': 'Score Analysis',
            'description': 'Your relationship score has been calculated.',
            'color': '#6b7280'
        }
    
    def _generate_insights(self, category_scores: List[CategoryScoreSchema], responses: Dict[str, Any]) -> List[QuizInsightSchema]:
        """Generate personalized insights based on category scores"""
        insights = []
        
        # Sort categories by score to identify strengths and weaknesses
        sorted_categories = sorted(category_scores, key=lambda x: x.percentage, reverse=True)
        
        # Identify strengths (top performing categories)
        if sorted_categories and sorted_categories[0].percentage >= 80:
            insights.append(QuizInsightSchema(
                category=sorted_categories[0].category,
                insight_type="strength",
                message=f"Your {sorted_categories[0].display_name.lower()} is a real strength in your relationship! Keep nurturing this area.",
                recommendation=f"Continue the great work in {sorted_categories[0].display_name.lower()}. Your efforts are paying off!"
            ))
        
        # Identify areas for improvement (lowest performing categories)
        if sorted_categories and sorted_categories[-1].percentage < 60:
            category = sorted_categories[-1]
            insights.append(QuizInsightSchema(
                category=category.category,
                insight_type="improvement",
                message=f"Your {category.display_name.lower()} shows room for growth. Small improvements here could make a big difference.",
                recommendation=self._get_category_recommendation(category.category)
            ))
        
        # Add specific insights based on category patterns
        communication_score = next((c.percentage for c in category_scores if c.category == "communication"), 0)
        trust_score = next((c.percentage for c in category_scores if c.category == "trust_security"), 0)
        
        if communication_score < 70 and trust_score < 70:
            insights.append(QuizInsightSchema(
                category="general",
                insight_type="tip",
                message="Both communication and trust could use attention. These often go hand in hand.",
                recommendation="Consider having an open conversation about how you both prefer to communicate and what makes you feel most secure."
            ))
        
        # Ensure we have at least one positive insight
        if not any(insight.insight_type == "strength" for insight in insights):
            if sorted_categories:
                best_category = sorted_categories[0]
                insights.append(QuizInsightSchema(
                    category=best_category.category,
                    insight_type="strength",
                    message=f"Your {best_category.display_name.lower()} is doing well and shows the potential in your relationship.",
                    recommendation="Build on this foundation to strengthen other areas of your relationship."
                ))
        
        return insights
    
    def _get_category_recommendation(self, category: str) -> str:
        """Get specific recommendations for category improvement"""
        recommendations = {
            "communication": "Try setting aside 15 minutes daily for uninterrupted conversation. Practice active listening and use 'I' statements when discussing concerns.",
            "trust_security": "Work on consistency in your actions and words. Be transparent about your feelings and follow through on commitments.",
            "intimacy_affection": "Make time for both physical and emotional intimacy. Express appreciation regularly and create rituals for connection.",
            "support_partnership": "Celebrate each other's goals and victories. Practice sharing responsibilities and making decisions together."
        }
        return recommendations.get(category, "Focus on open communication and mutual understanding in this area.")
    
    def save_quiz_result(self, user_id: str, quiz_id: str, score_data: Dict[str, Any]) -> QuizResult:
        """Save quiz result to database"""
        
        quiz_result = QuizResult(
            user_id=user_id,
            quiz_id=quiz_id,
            responses_json=score_data['responses'],
            scores_json=score_data['category_scores'],
            overall_score=score_data['overall_score'],
            category_scores=score_data['category_scores'],
            interpretation=score_data['interpretation'],
            insights=score_data['insights']
        )
        
        self.db.add(quiz_result)
        self.db.commit()
        self.db.refresh(quiz_result)
        
        # Check for achievements
        self._check_achievements(user_id, quiz_result)
        
        return quiz_result
    
    async def _generate_comprehensive_insights(self, category_scores: List[CategoryScoreSchema], overall_score: float, interpretation_data: Dict[str, Any]) -> str:
        """Generate comprehensive relationship insights using AI"""
        try:
            ai_service = create_ai_service()
            
            # Build context for AI
            category_summary = []
            for category in category_scores:
                category_summary.append(f"{category.display_name}: {category.percentage:.1f}% ({category.interpretation})")
            
            prompt = f"""Based on this relationship quiz evaluation, provide a comprehensive insight about the relationship dynamics:

Overall Score: {overall_score:.1f}% - {interpretation_data.get('title', 'Result')}
Category Breakdown:
{chr(10).join(category_summary)}

Please provide a 2-3 paragraph personalized insight that:
1. Summarizes the overall relationship health
2. Highlights key patterns or dynamics
3. Offers encouraging perspective while being realistic about areas needing attention

Keep the tone supportive, professional, and relationship-focused. This is for a couple looking to understand their relationship better."""

            messages = [{"role": "user", "content": prompt}]
            response = await ai_service.provider.generate_completion(messages, max_tokens=300, temperature=0.7)
            
            return response.get("message", self._get_fallback_insights(category_scores, overall_score, interpretation_data))
            
        except Exception as e:
            logger.error(f"Error generating comprehensive insights: {str(e)}")
            return self._get_fallback_insights(category_scores, overall_score, interpretation_data)
    
    async def _generate_relationship_tips(self, category_scores: List[CategoryScoreSchema], overall_score: float) -> List[Dict[str, str]]:
        """Generate 3 actionable relationship tips using AI"""
        try:
            ai_service = create_ai_service()
            
            # Identify areas needing improvement
            improvement_areas = [cat for cat in category_scores if cat.percentage < 70]
            strength_areas = [cat for cat in category_scores if cat.percentage >= 75]
            
            context = f"""Based on these relationship assessment results (Overall: {overall_score:.1f}%):

Areas needing attention:
{chr(10).join([f"- {cat.display_name}: {cat.percentage:.1f}%" for cat in improvement_areas[:2]])}

Strengths to build on:
{chr(10).join([f"- {cat.display_name}: {cat.percentage:.1f}%" for cat in strength_areas[:2]])}

Generate exactly 3 actionable relationship tips. Each tip should be:
- Specific and actionable (something couples can actually do)
- Focused on the areas that need improvement
- Practical for busy couples
- Encouraging and positive in tone

Format each tip as:
Title: [Brief title]
Description: [1-2 sentence actionable advice]

Keep each tip concise but meaningful."""

            messages = [{"role": "user", "content": context}]
            response = await ai_service.provider.generate_completion(messages, max_tokens=250, temperature=0.6)
            
            # Parse AI response into structured tips
            tips_text = response.get("message", "")
            tips = self._parse_tips_from_ai_response(tips_text)
            
            # Ensure we have exactly 3 tips
            if len(tips) < 3:
                tips.extend(self._get_fallback_tips(category_scores)[len(tips):3])
            
            return tips[:3]
            
        except Exception as e:
            logger.error(f"Error generating relationship tips: {str(e)}")
            return self._get_fallback_tips(category_scores)
    
    def _parse_tips_from_ai_response(self, ai_response: str) -> List[Dict[str, str]]:
        """Parse AI response to extract structured tips"""
        tips = []
        lines = ai_response.strip().split('\n')
        current_tip = {}
        
        for line in lines:
            line = line.strip()
            if line.startswith('Title:'):
                if current_tip:
                    tips.append(current_tip)
                current_tip = {"title": line.replace('Title:', '').strip()}
            elif line.startswith('Description:'):
                if current_tip:
                    current_tip["description"] = line.replace('Description:', '').strip()
                    tips.append(current_tip)
                    current_tip = {}
            elif line and not line.startswith(('1.', '2.', '3.', '-')) and current_tip and "title" in current_tip and "description" not in current_tip:
                current_tip["description"] = line
                tips.append(current_tip)
                current_tip = {}
        
        # Add any remaining tip
        if current_tip and "title" in current_tip:
            if "description" not in current_tip:
                current_tip["description"] = "Focus on this area for relationship improvement."
            tips.append(current_tip)
        
        return tips
    
    def _get_fallback_insights(self, category_scores: List[CategoryScoreSchema], overall_score: float, interpretation_data: Dict[str, Any]) -> str:
        """Fallback insights when AI is unavailable"""
        sorted_categories = sorted(category_scores, key=lambda x: x.percentage, reverse=True)
        best_category = sorted_categories[0] if sorted_categories else None
        worst_category = sorted_categories[-1] if sorted_categories else None
        
        insight = f"Your relationship shows an overall health score of {overall_score:.1f}%, indicating {interpretation_data.get('level', 'average')} relationship dynamics. "
        
        if best_category and best_category.percentage >= 75:
            insight += f"Your strongest area is {best_category.display_name.lower()}, where you're performing excellently. This is a solid foundation to build upon. "
        
        if worst_category and worst_category.percentage < 65:
            insight += f"The area that could benefit most from attention is {worst_category.display_name.lower()}. Small improvements here could make a significant positive impact on your relationship overall."
        else:
            insight += "Your relationship shows balanced development across all key areas, which is a positive sign for long-term success."
        
        return insight
    
    def _get_fallback_tips(self, category_scores: List[CategoryScoreSchema]) -> List[Dict[str, str]]:
        """Fallback tips when AI is unavailable"""
        sorted_categories = sorted(category_scores, key=lambda x: x.percentage)
        
        base_tips = [
            {
                "title": "Daily Connection Time",
                "description": "Set aside 15 minutes each day for uninterrupted conversation about your day, feelings, and thoughts."
            },
            {
                "title": "Express Appreciation",
                "description": "Share one thing you appreciate about your partner every day, focusing on their actions and qualities."
            },
            {
                "title": "Active Listening Practice",
                "description": "When your partner speaks, focus completely on understanding their perspective before responding."
            }
        ]
        
        # Customize tips based on lowest scoring categories
        if len(sorted_categories) > 0:
            lowest_category = sorted_categories[0]
            category_tips = {
                "communication": {
                    "title": "Improve Communication",
                    "description": "Use 'I' statements when discussing concerns and ask open-ended questions to understand each other better."
                },
                "trust_security": {
                    "title": "Build Trust",
                    "description": "Follow through on commitments consistently and share your thoughts and feelings openly with your partner."
                },
                "intimacy_affection": {
                    "title": "Enhance Intimacy",
                    "description": "Create regular opportunities for physical and emotional closeness through dedicated couple time."
                },
                "support_partnership": {
                    "title": "Strengthen Partnership",
                    "description": "Celebrate each other's successes and work together as a team on shared goals and decisions."
                }
            }
            
            if lowest_category.category in category_tips:
                base_tips[0] = category_tips[lowest_category.category]
        
        return base_tips
    
    def _check_achievements(self, user_id: str, quiz_result: QuizResult):
        """Check and award achievements based on quiz results"""
        
        # Check for first quiz completion
        previous_results = self.db.query(QuizResult).filter(
            QuizResult.user_id == user_id,
            QuizResult.id != quiz_result.id
        ).count()
        
        if previous_results == 0:
            achievement = QuizAchievement(
                user_id=user_id,
                achievement_type="first_quiz",
                achievement_data={
                    "title": "First Steps",
                    "description": "Completed your first relationship quiz!",
                    "icon": "🎯",
                    "score": quiz_result.overall_score
                },
                quiz_result_id=quiz_result.id
            )
            self.db.add(achievement)
        
        # Check for high score achievement
        if quiz_result.overall_score >= 85:
            achievement = QuizAchievement(
                user_id=user_id,
                achievement_type="high_score",
                achievement_data={
                    "title": "Relationship Champion",
                    "description": "Scored 85% or higher on a relationship quiz!",
                    "icon": "🏆",
                    "score": quiz_result.overall_score
                },
                quiz_result_id=quiz_result.id
            )
            self.db.add(achievement)
        
        # Check for improvement achievement
        previous_best = self.db.query(QuizResult).filter(
            QuizResult.user_id == user_id,
            QuizResult.quiz_id == quiz_result.quiz_id,
            QuizResult.id != quiz_result.id
        ).order_by(QuizResult.overall_score.desc()).first()
        
        if previous_best and quiz_result.overall_score > previous_best.overall_score + 10:
            achievement = QuizAchievement(
                user_id=user_id,
                achievement_type="improvement",
                achievement_data={
                    "title": "Growing Together",
                    "description": f"Improved your score by {quiz_result.overall_score - previous_best.overall_score:.1f} points!",
                    "icon": "📈",
                    "score": quiz_result.overall_score,
                    "previous_score": previous_best.overall_score
                },
                quiz_result_id=quiz_result.id
            )
            self.db.add(achievement)
        
        self.db.commit()
