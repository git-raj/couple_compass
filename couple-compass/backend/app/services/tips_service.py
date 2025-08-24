from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.user import User
from ..models.tip import UserTip
from ..models.chat import ChatSession, ChatMessage
from ..models.mood import MoodCheckin
from ..schemas.tip import TipResponse, TipsHistoryResponse
from .ai_service import AIService
from .chat_service import ChatService

logger = logging.getLogger(__name__)

class TipsService:
    def __init__(self):
        self.ai_service = AIService()
        self.chat_service = ChatService()
        self.max_tips_per_day = 3
    
    async def generate_relationship_tip(
        self, 
        db: Session, 
        user_id: int
    ) -> TipResponse:
        """Generate a personalized relationship tip based on user context"""
        try:
            # Check rate limiting
            if not await self._can_generate_tip(db, user_id):
                raise ValueError("Daily tip generation limit reached (3 tips per day)")
            
            # Get user context
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Gather context for AI
            context = await self._gather_user_context(db, user)
            
            # Generate tip using AI
            tip_content = await self._generate_ai_tip(context)
            
            # Save tip to database
            user_tip = UserTip(
                user_id=user_id,
                tip_id=None,  # We're storing content directly in context_json
                context_json={
                    "content": tip_content["content"],
                    "category": tip_content["category"],
                    "generated_from": context["summary"]
                },
                status="suggested"
            )
            
            db.add(user_tip)
            db.commit()
            db.refresh(user_tip)
            
            logger.info(f"Generated relationship tip for user {user_id}")
            
            return TipResponse(
                id=user_tip.id,
                content=tip_content["content"],
                category=tip_content["category"],
                created_at=user_tip.created_at
            )
            
        except Exception as e:
            logger.error(f"Error generating relationship tip: {str(e)}")
            db.rollback()
            raise
    
    def get_user_tips(
        self, 
        db: Session, 
        user_id: int, 
        limit: int = 5
    ) -> TipsHistoryResponse:
        """Get user's recent tips"""
        try:
            tips = db.query(UserTip).filter(
                UserTip.user_id == user_id
            ).order_by(
                desc(UserTip.created_at)
            ).limit(limit).all()
            
            tip_responses = []
            for tip in tips:
                if tip.context_json and "content" in tip.context_json:
                    tip_responses.append(TipResponse(
                        id=tip.id,
                        content=tip.context_json["content"],
                        category=tip.context_json.get("category", "general"),
                        created_at=tip.created_at
                    ))
            
            return TipsHistoryResponse(tips=tip_responses)
            
        except Exception as e:
            logger.error(f"Error getting user tips: {str(e)}")
            raise
    
    def get_latest_tip(
        self, 
        db: Session, 
        user_id: int
    ) -> Optional[TipResponse]:
        """Get user's most recent tip"""
        try:
            latest_tip = db.query(UserTip).filter(
                UserTip.user_id == user_id
            ).order_by(
                desc(UserTip.created_at)
            ).first()
            
            if latest_tip and latest_tip.context_json and "content" in latest_tip.context_json:
                return TipResponse(
                    id=latest_tip.id,
                    content=latest_tip.context_json["content"],
                    category=latest_tip.context_json.get("category", "general"),
                    created_at=latest_tip.created_at
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting latest tip: {str(e)}")
            return None
    
    async def mark_tip_viewed(
        self, 
        db: Session, 
        user_id: int, 
        tip_id: str
    ) -> bool:
        """Mark a tip as viewed"""
        try:
            tip = db.query(UserTip).filter(
                UserTip.id == tip_id,
                UserTip.user_id == user_id
            ).first()
            
            if not tip:
                return False
            
            tip.status = "viewed"
            tip.viewed_at = datetime.now(timezone.utc)
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error marking tip as viewed: {str(e)}")
            db.rollback()
            return False
    
    async def _can_generate_tip(
        self, 
        db: Session, 
        user_id: int
    ) -> bool:
        """Check if user can generate a new tip (rate limiting)"""
        try:
            today = datetime.now(timezone.utc).date()
            today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
            
            tips_today = db.query(UserTip).filter(
                UserTip.user_id == user_id,
                UserTip.created_at >= today_start
            ).count()
            
            return tips_today < self.max_tips_per_day
            
        except Exception as e:
            logger.error(f"Error checking tip generation limit: {str(e)}")
            return False
    
    async def _gather_user_context(
        self, 
        db: Session, 
        user: User
    ) -> Dict[str, Any]:
        """Gather user context for tip generation"""
        try:
            context = {
                "user_profile": {
                    "name": user.name,
                    "relationship_status": user.relationship_status,
                    "partner_name": user.partner_name,
                    "anniversary_date": user.anniversary_date,
                    "has_partner": user.partner_id is not None
                },
                "chat_summaries": [],
                "mood_patterns": {},
                "partner_profile": None
            }
            
            # Get recent chat summaries
            recent_sessions = db.query(ChatSession).filter(
                ChatSession.user_id == user.id
            ).order_by(
                desc(ChatSession.last_activity)
            ).limit(5).all()
            
            for session in recent_sessions:
                if session.metadata and "summary" in session.metadata:
                    context["chat_summaries"].append(session.metadata["summary"])
            
            # Get mood patterns from last 30 days
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            mood_checkins = db.query(MoodCheckin).filter(
                MoodCheckin.user_id == user.id,
                MoodCheckin.created_at >= thirty_days_ago
            ).all()
            
            if mood_checkins:
                moods = [checkin.mood_rating for checkin in mood_checkins]
                context["mood_patterns"] = {
                    "average_mood": sum(moods) / len(moods),
                    "mood_trend": self._calculate_mood_trend(mood_checkins),
                    "total_checkins": len(mood_checkins)
                }
            
            # Get partner profile if linked
            if user.partner_id:
                partner = db.query(User).filter(User.id == user.partner_id).first()
                if partner:
                    context["partner_profile"] = {
                        "name": partner.name,
                        "relationship_status": partner.relationship_status
                    }
            
            # Create summary for context
            context["summary"] = self._create_context_summary(context)
            
            return context
            
        except Exception as e:
            logger.error(f"Error gathering user context: {str(e)}")
            return {"user_profile": {}, "chat_summaries": [], "mood_patterns": {}, "partner_profile": None, "summary": "Limited context available"}
    
    def _calculate_mood_trend(self, mood_checkins: List) -> str:
        """Calculate mood trend from checkins"""
        if len(mood_checkins) < 2:
            return "stable"
        
        # Sort by date
        sorted_checkins = sorted(mood_checkins, key=lambda x: x.created_at)
        
        # Compare first half vs second half averages
        mid_point = len(sorted_checkins) // 2
        first_half_avg = sum([c.mood_rating for c in sorted_checkins[:mid_point]]) / mid_point
        second_half_avg = sum([c.mood_rating for c in sorted_checkins[mid_point:]]) / (len(sorted_checkins) - mid_point)
        
        if second_half_avg > first_half_avg + 0.5:
            return "improving"
        elif second_half_avg < first_half_avg - 0.5:
            return "declining"
        else:
            return "stable"
    
    def _create_context_summary(self, context: Dict[str, Any]) -> str:
        """Create a summary of the context for AI prompt"""
        summary_parts = []
        
        profile = context["user_profile"]
        if profile.get("relationship_status"):
            summary_parts.append(f"Relationship status: {profile['relationship_status']}")
        
        if profile.get("has_partner"):
            summary_parts.append("Has linked partner account")
        
        if context["chat_summaries"]:
            summary_parts.append(f"Recent chat topics: {', '.join(context['chat_summaries'][:2])}")
        
        mood_patterns = context["mood_patterns"]
        if mood_patterns:
            trend = mood_patterns.get("trend", "stable")
            avg = mood_patterns.get("average_mood", 0)
            summary_parts.append(f"Mood trend: {trend} (avg: {avg:.1f}/10)")
        
        return "; ".join(summary_parts) if summary_parts else "New user with limited history"
    
    async def _generate_ai_tip(self, context: Dict[str, Any]) -> Dict[str, str]:
        """Generate AI-powered relationship tip"""
        try:
            prompt = self._build_tip_generation_prompt(context)
            
            messages = [
                {"role": "system", "content": "You are a professional relationship counselor providing personalized advice."},
                {"role": "user", "content": prompt}
            ]
            
            # Generate tip using AI service
            response_data = await self.ai_service.provider.generate_completion(
                messages=messages,
                max_tokens=200,
                temperature=0.7
            )
            
            # Parse the response
            tip_text = response_data["message"].strip()
            
            # Determine category based on content
            category = self._determine_tip_category(tip_text, context)
            
            return {
                "content": tip_text,
                "category": category
            }
            
        except Exception as e:
            logger.error(f"Error generating AI tip: {str(e)}")
            return self._get_fallback_tip(context)
    
    def _build_tip_generation_prompt(self, context: Dict[str, Any]) -> str:
        """Build the prompt for AI tip generation"""
        profile = context["user_profile"]
        
        prompt = f"""Generate ONE specific, actionable relationship tip for this person:

User Context:
- Name: {profile.get('name', 'User')}
- Relationship Status: {profile.get('relationship_status', 'Unknown')}
- Has Partner Connected: {profile.get('has_partner', False)}
- Recent Activity: {context.get('summary', 'Limited activity')}

Requirements:
- Make it personal and actionable
- Keep it positive and encouraging  
- 2-3 sentences maximum
- Something they can do today or this week
- Focus on one specific area for improvement

Categories to choose from: Communication, Quality Time, Emotional Support, Conflict Resolution, Personal Growth

Format: Just provide the tip text, nothing else."""

        return prompt
    
    def _determine_tip_category(self, tip_text: str, context: Dict[str, Any]) -> str:
        """Determine the category of the tip based on content"""
        tip_lower = tip_text.lower()
        
        if any(word in tip_lower for word in ['talk', 'listen', 'communicate', 'conversation', 'express', 'share']):
            return "Communication"
        elif any(word in tip_lower for word in ['time', 'together', 'date', 'activity', 'fun']):
            return "Quality Time"
        elif any(word in tip_lower for word in ['support', 'comfort', 'understand', 'empathy', 'feelings']):
            return "Emotional Support"
        elif any(word in tip_lower for word in ['conflict', 'argue', 'disagree', 'resolve', 'compromise']):
            return "Conflict Resolution"
        elif any(word in tip_lower for word in ['grow', 'improve', 'learn', 'develop', 'goal']):
            return "Personal Growth"
        else:
            return "General"
    
    def _get_fallback_tip(self, context: Dict[str, Any]) -> Dict[str, str]:
        """Provide fallback tip when AI is unavailable"""
        fallback_tips = [
            {
                "content": "Take 10 minutes today to ask your partner about their day and really listen to their response without planning what you'll say next.",
                "category": "Communication"
            },
            {
                "content": "Plan one small surprise for your partner this week - it could be their favorite snack, a kind note, or doing a chore they usually handle.",
                "category": "Quality Time"
            },
            {
                "content": "Practice expressing gratitude by telling your partner one specific thing you appreciate about them today.",
                "category": "Emotional Support"
            }
        ]
        
        # Choose based on context or randomly
        import random
        return random.choice(fallback_tips)
