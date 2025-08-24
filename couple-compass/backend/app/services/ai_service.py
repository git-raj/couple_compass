import openai
from typing import List, Dict, Any, Optional
import json
import logging
from ..config import get_settings
from ..schemas.chat import AIResponse

settings = get_settings()
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4-turbo-preview"
        self.max_tokens = 1500
        
    def get_relationship_mediation_prompt(self) -> str:
        """Get the system prompt for relationship mediation"""
        return """You are a professional relationship counselor and mediator specializing in helping couples resolve conflicts and improve communication. Your role is to:

1. Listen actively and empathetically to both partners
2. Help identify underlying issues and emotions
3. Provide constructive guidance without taking sides
4. Suggest healthy communication techniques
5. Offer actionable advice for resolving conflicts
6. Maintain a warm, supportive, and non-judgmental tone

Guidelines:
- Always acknowledge both partners' feelings and perspectives
- Ask clarifying questions to better understand the situation
- Suggest specific communication techniques (I-statements, active listening, etc.)
- Encourage empathy and understanding between partners
- Provide practical solutions and compromise strategies
- If discussing serious issues (abuse, addiction), recommend professional help
- Keep responses concise but thorough (2-4 paragraphs typically)
- Use a warm, professional tone that feels supportive

Remember: You're here to facilitate healthy communication and provide guidance, not to make decisions for the couple."""

    async def generate_mediation_response(
        self, 
        message: str, 
        conversation_history: List[Dict[str, str]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> AIResponse:
        """Generate AI response for relationship mediation"""
        try:
            # Build conversation context
            messages = [
                {"role": "system", "content": self.get_relationship_mediation_prompt()}
            ]
            
            # Add conversation history if available
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages for context
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })
            
            # Generate response
            response = await self.client.chat.completions.acreate(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            # Extract response data
            ai_message = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Generate suggested actions based on content analysis
            suggested_actions = await self._generate_suggested_actions(ai_message, message)
            
            return AIResponse(
                message=ai_message,
                tokens_used=tokens_used,
                confidence_score=0.85,  # Could be dynamic based on response quality
                suggested_actions=suggested_actions,
                metadata={
                    "model": self.model,
                    "temperature": 0.7,
                    "context_length": len(messages)
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return AIResponse(
                message="I apologize, but I'm having trouble processing your message right now. Please try again in a moment, or consider reaching out to a professional counselor if you need immediate support.",
                tokens_used=0,
                confidence_score=0.0,
                suggested_actions=["Try rephrasing your message", "Contact a professional counselor"],
                metadata={"error": str(e)}
            )
    
    async def _generate_suggested_actions(self, ai_response: str, user_message: str) -> List[str]:
        """Generate contextual suggested actions based on the conversation"""
        try:
            # Analyze the context to suggest relevant actions
            analysis_prompt = f"""Based on this relationship advice conversation:

User message: "{user_message}"
AI response: "{ai_response}"

Generate 2-3 specific, actionable suggestions that the user could take. Format as a simple list.
Examples: "Schedule a weekly check-in conversation", "Practice active listening during your next discussion", "Set boundaries around work-life balance"

Keep suggestions practical and specific to their situation."""

            response = await self.client.chat.completions.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": analysis_prompt}],
                max_tokens=150,
                temperature=0.5
            )
            
            suggestions_text = response.choices[0].message.content
            # Parse suggestions (assuming they're in a list format)
            suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip() and not s.strip().startswith('-')]
            
            return suggestions[:3]  # Limit to 3 suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggested actions: {str(e)}")
            return ["Continue the conversation", "Reflect on the advice given", "Consider discussing this with your partner"]
    
    async def moderate_content(self, content: str) -> Dict[str, Any]:
        """Check content for inappropriate material"""
        try:
            response = await self.client.moderations.acreate(input=content)
            moderation = response.results[0]
            
            return {
                "flagged": moderation.flagged,
                "categories": dict(moderation.categories),
                "category_scores": dict(moderation.category_scores)
            }
            
        except Exception as e:
            logger.error(f"Error moderating content: {str(e)}")
            return {"flagged": False, "categories": {}, "category_scores": {}}
    
    async def generate_conversation_summary(self, messages: List[Dict[str, str]]) -> str:
        """Generate a summary of the conversation for context storage"""
        try:
            # Prepare messages for summarization
            conversation_text = "\n".join([
                f"{msg.get('role', 'user')}: {msg.get('content', '')}" 
                for msg in messages
            ])
            
            summary_prompt = f"""Summarize this relationship counseling conversation in 2-3 sentences, focusing on:
1. The main issues discussed
2. Key advice or insights provided
3. Any agreements or next steps mentioned

Conversation:
{conversation_text}

Summary:"""

            response = await self.client.chat.completions.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": summary_prompt}],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating conversation summary: {str(e)}")
            return "Conversation summary unavailable"
    
    async def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings for text to store in vector database"""
        try:
            response = await self.client.embeddings.acreate(
                model="text-embedding-3-small",
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            return []
