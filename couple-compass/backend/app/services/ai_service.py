import openai
import google.generativeai as genai
from typing import List, Dict, Any, Optional, Union
import json
import logging
from abc import ABC, abstractmethod
from ..config import get_settings
from ..schemas.chat import AIResponse

settings = get_settings()
logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def generate_completion(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1500,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate a completion from the LLM"""
        pass
    
    @abstractmethod
    async def moderate_content(self, content: str) -> Dict[str, Any]:
        """Moderate content for safety"""
        pass
    
    @abstractmethod
    async def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings for text"""
        pass

class OpenAIProvider(LLMProvider):
    """OpenAI provider implementation"""
    
    def __init__(self, api_key: str, model: str, embeddings_model: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
        self.embeddings_model = embeddings_model
    
    async def generate_completion(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1500,
        temperature: float = 0.7,
        presence_penalty: float = 0.1,
        frequency_penalty: float = 0.1
    ) -> Dict[str, Any]:
        """Generate completion using OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                presence_penalty=presence_penalty,
                frequency_penalty=frequency_penalty
            )
            
            return {
                "message": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "provider": "openai",
                "model": self.model
            }
        except Exception as e:
            logger.error(f"OpenAI completion error: {str(e)}")
            raise
    
    async def moderate_content(self, content: str) -> Dict[str, Any]:
        """Moderate content using OpenAI"""
        try:
            response = self.client.moderations.create(input=content)
            moderation = response.results[0]
            
            return {
                "flagged": moderation.flagged,
                "categories": dict(moderation.categories),
                "category_scores": dict(moderation.category_scores),
                "provider": "openai"
            }
        except Exception as e:
            logger.error(f"OpenAI moderation error: {str(e)}")
            return {"flagged": False, "categories": {}, "category_scores": {}, "provider": "openai"}
    
    async def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings using OpenAI"""
        try:
            response = self.client.embeddings.create(
                model=self.embeddings_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embeddings error: {str(e)}")
            return []

class GeminiProvider(LLMProvider):
    """Google Gemini provider implementation"""
    
    def __init__(self, api_key: str, model: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
        self.model_name = model
    
    async def generate_completion(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1500,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate completion using Google Gemini"""
        try:
            # Convert OpenAI format to Gemini format
            gemini_messages = self._convert_messages_to_gemini_format(messages)
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            )
            
            # Generate response
            response = self.model.generate_content(
                gemini_messages,
                generation_config=generation_config
            )
            
            # Estimate token usage (Gemini doesn't provide exact count)
            estimated_tokens = len(response.text.split()) * 1.3  # Rough estimation
            
            return {
                "message": response.text,
                "tokens_used": int(estimated_tokens),
                "provider": "gemini",
                "model": self.model_name
            }
        except Exception as e:
            logger.error(f"Gemini completion error: {str(e)}")
            raise
    
    def _convert_messages_to_gemini_format(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI message format to Gemini prompt format"""
        prompt_parts = []
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"Instructions: {content}\n")
            elif role == "user":
                prompt_parts.append(f"User: {content}\n")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}\n")
        
        return "".join(prompt_parts)
    
    async def moderate_content(self, content: str) -> Dict[str, Any]:
        """Moderate content using basic text analysis (Gemini doesn't have built-in moderation)"""
        # Basic content moderation - in production, you might want to use a dedicated service
        flagged_words = ["abuse", "violence", "hate", "harassment"]
        content_lower = content.lower()
        
        flagged = any(word in content_lower for word in flagged_words)
        
        return {
            "flagged": flagged,
            "categories": {"harassment": flagged},
            "category_scores": {"harassment": 0.8 if flagged else 0.1},
            "provider": "gemini"
        }
    
    async def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings using Google's embedding model"""
        try:
            # Use Google's embedding model
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="semantic_similarity"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Gemini embeddings error: {str(e)}")
            # Fallback to a zero vector of standard size if embeddings fail
            return [0.0] * 768  # Standard embedding dimension for text-embedding-ada-002

class AIService:
    """Multi-provider AI service with unified interface"""
    
    def __init__(self, provider: Optional[str] = None):
        self.provider_name = provider or settings.default_llm_provider
        self.max_tokens = 1500
        self.provider = self._initialize_provider()
        
    def _initialize_provider(self) -> LLMProvider:
        """Initialize the appropriate LLM provider"""
        if self.provider_name.lower() == "openai":
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key not configured")
            return OpenAIProvider(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                embeddings_model=settings.openai_embeddings_model
            )
        elif self.provider_name.lower() == "gemini":
            if not settings.gemini_api_key:
                raise ValueError("Gemini API key not configured")
            return GeminiProvider(
                api_key=settings.gemini_api_key,
                model=settings.gemini_model
            )
        else:
            raise ValueError(f"Unsupported provider: {self.provider_name}")
    
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
            
            # Generate response using the configured provider
            response_data = await self.provider.generate_completion(
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=0.7
            )
            
            # Generate suggested actions based on content analysis
            suggested_actions = await self._generate_suggested_actions(
                response_data["message"], 
                message
            )
            
            return AIResponse(
                message=response_data["message"],
                tokens_used=response_data["tokens_used"],
                confidence_score=0.85,  # Could be dynamic based on response quality
                suggested_actions=suggested_actions,
                metadata={
                    "provider": response_data["provider"],
                    "model": response_data["model"],
                    "temperature": 0.7,
                    "context_length": len(messages)
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating AI response with {self.provider_name}: {str(e)}")
            return AIResponse(
                message="I apologize, but I'm having trouble processing your message right now. Please try again in a moment, or consider reaching out to a professional counselor if you need immediate support.",
                tokens_used=0,
                confidence_score=0.0,
                suggested_actions=["Try rephrasing your message", "Contact a professional counselor"],
                metadata={"error": str(e), "provider": self.provider_name}
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

            messages = [{"role": "user", "content": analysis_prompt}]
            
            # Use a lighter model for suggestions (OpenAI fallback)
            if self.provider_name.lower() == "openai":
                response_data = await self.provider.generate_completion(
                    messages=messages,
                    max_tokens=150,
                    temperature=0.5
                )
            else:
                # For Gemini, use the main model but with lower parameters
                response_data = await self.provider.generate_completion(
                    messages=messages,
                    max_tokens=150,
                    temperature=0.5
                )
            
            suggestions_text = response_data["message"]
            # Parse suggestions (assuming they're in a list format)
            suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip() and not s.strip().startswith('-')]
            
            return suggestions[:3]  # Limit to 3 suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggested actions: {str(e)}")
            return ["Continue the conversation", "Reflect on the advice given", "Consider discussing this with your partner"]
    
    async def moderate_content(self, content: str) -> Dict[str, Any]:
        """Check content for inappropriate material"""
        try:
            return await self.provider.moderate_content(content)
        except Exception as e:
            logger.error(f"Error moderating content: {str(e)}")
            return {"flagged": False, "categories": {}, "category_scores": {}, "provider": self.provider_name}
    
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

            summary_messages = [{"role": "user", "content": summary_prompt}]
            
            response_data = await self.provider.generate_completion(
                messages=summary_messages,
                max_tokens=200,
                temperature=0.3
            )
            
            return response_data["message"]
            
        except Exception as e:
            logger.error(f"Error generating conversation summary: {str(e)}")
            return "Conversation summary unavailable"
    
    async def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings for text to store in vector database"""
        try:
            return await self.provider.get_embeddings(text)
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            return []

# Factory function for easy provider switching
def create_ai_service(provider: Optional[str] = None) -> AIService:
    """Create an AI service instance with the specified provider"""
    return AIService(provider=provider)
