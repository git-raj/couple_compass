from typing import List, Dict, Any, Optional
import logging
from sqlalchemy.orm import Session
from ..models.chat import ChatSession, ChatMessage, ConversationContext
from ..models.user import User
from ..schemas.chat import (
    ChatSessionCreate, ChatMessageCreate, ChatMessageSend, 
    AIResponse, ChatSessionResponse, ChatMessageResponse
)
from .ai_service import AIService
from .vector_service import VectorService
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.ai_service = AIService()
        self.vector_service = VectorService()
    
    async def create_chat_session(
        self, 
        db: Session, 
        user_id: int, 
        session_data: ChatSessionCreate
    ) -> ChatSessionResponse:
        """Create a new chat session"""
        try:
            # Create session in database
            db_session = ChatSession(
                user_id=user_id,
                title=session_data.title,
                partner_user_id=session_data.partner_user_id,
                session_type=session_data.session_type,
                topic=session_data.topic,
                metadata=session_data.metadata or {}
            )
            
            db.add(db_session)
            db.commit()
            db.refresh(db_session)
            
            logger.info(f"Created chat session {db_session.id} for user {user_id}")
            
            return ChatSessionResponse.from_orm(db_session)
            
        except Exception as e:
            logger.error(f"Error creating chat session: {str(e)}")
            db.rollback()
            raise
    
    async def send_message(
        self,
        db: Session,
        session_id: int,
        user_id: int,
        message_data: ChatMessageSend
    ) -> Dict[str, Any]:
        """Send a message and get AI response"""
        try:
            # Verify session exists and user has access
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Chat session not found or access denied")
            
            # Content moderation
            moderation_result = await self.ai_service.moderate_content(message_data.content)
            if moderation_result["flagged"]:
                logger.warning(f"Flagged content from user {user_id}: {moderation_result}")
                raise ValueError("Message content violates community guidelines")
            
            # Store user message
            user_message = ChatMessage(
                session_id=session_id,
                user_id=user_id,
                role="user",
                content=message_data.content,
                message_type=message_data.message_type,
                parent_message_id=message_data.parent_message_id
            )
            
            db.add(user_message)
            db.commit()
            db.refresh(user_message)
            
            # Store message in vector database for context
            await self.vector_service.store_conversation_context(
                session_id=session_id,
                content=message_data.content,
                content_type="user_message",
                user_id=user_id,
                metadata={
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "message_id": user_message.id
                }
            )
            
            # Get conversation history for context
            conversation_history = await self._get_conversation_history(db, session_id, limit=10)
            
            # Search for relevant context using RAG
            relevant_context = await self.vector_service.search_relevant_context(
                query=message_data.content,
                session_id=session_id,
                limit=5
            )
            
            # Generate AI response with context
            ai_response = await self.ai_service.generate_mediation_response(
                message=message_data.content,
                conversation_history=conversation_history,
                user_context={
                    "relevant_context": relevant_context,
                    "session_type": session.session_type,
                    "topic": session.topic
                }
            )
            
            # Store AI response
            ai_message = ChatMessage(
                session_id=session_id,
                user_id=None,  # AI message
                role="ai",
                content=ai_response.message,
                message_type="text",
                parent_message_id=user_message.id,
                tokens_used=ai_response.tokens_used,
                metadata=ai_response.metadata
            )
            
            db.add(ai_message)
            
            # Update session activity
            session.last_activity = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(ai_message)
            
            # Store AI response in vector database
            await self.vector_service.store_conversation_context(
                session_id=session_id,
                content=ai_response.message,
                content_type="ai_response",
                user_id=None,
                metadata={
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "message_id": ai_message.id,
                    "tokens_used": ai_response.tokens_used
                }
            )
            
            return {
                "user_message": ChatMessageResponse.from_orm(user_message),
                "ai_response": ChatMessageResponse.from_orm(ai_message),
                "suggested_actions": ai_response.suggested_actions,
                "confidence_score": ai_response.confidence_score
            }
            
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            db.rollback()
            raise
    
    async def get_chat_sessions(
        self,
        db: Session,
        user_id: int,
        limit: int = 20,
        offset: int = 0
    ) -> List[ChatSessionResponse]:
        """Get user's chat sessions"""
        try:
            sessions = db.query(ChatSession).filter(
                ChatSession.user_id == user_id
            ).order_by(
                ChatSession.last_activity.desc()
            ).limit(limit).offset(offset).all()
            
            return [ChatSessionResponse.from_orm(session) for session in sessions]
            
        except Exception as e:
            logger.error(f"Error getting chat sessions: {str(e)}")
            raise
    
    async def get_chat_history(
        self,
        db: Session,
        session_id: int,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[ChatMessageResponse]:
        """Get chat history for a session"""
        try:
            # Verify user has access to session
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Chat session not found or access denied")
            
            # Get messages
            messages = db.query(ChatMessage).filter(
                ChatMessage.session_id == session_id,
                ChatMessage.is_deleted == False
            ).order_by(
                ChatMessage.created_at.asc()
            ).limit(limit).offset(offset).all()
            
            return [ChatMessageResponse.from_orm(message) for message in messages]
            
        except Exception as e:
            logger.error(f"Error getting chat history: {str(e)}")
            raise
    
    async def delete_chat_session(
        self,
        db: Session,
        session_id: int,
        user_id: int
    ) -> bool:
        """Delete a chat session and all associated data"""
        try:
            # Verify user owns the session
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Chat session not found or access denied")
            
            # Delete vector data
            await self.vector_service.delete_session_context(session_id)
            
            # Delete from database (cascade will handle messages and contexts)
            db.delete(session)
            db.commit()
            
            logger.info(f"Deleted chat session {session_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting chat session: {str(e)}")
            db.rollback()
            raise
    
    async def update_session_title(
        self,
        db: Session,
        session_id: int,
        user_id: int,
        title: str
    ) -> ChatSessionResponse:
        """Update chat session title"""
        try:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Chat session not found or access denied")
            
            session.title = title
            db.commit()
            db.refresh(session)
            
            return ChatSessionResponse.from_orm(session)
            
        except Exception as e:
            logger.error(f"Error updating session title: {str(e)}")
            db.rollback()
            raise
    
    async def _get_conversation_history(
        self,
        db: Session,
        session_id: int,
        limit: int = 10
    ) -> List[Dict[str, str]]:
        """Get recent conversation history for AI context"""
        try:
            messages = db.query(ChatMessage).filter(
                ChatMessage.session_id == session_id,
                ChatMessage.is_deleted == False
            ).order_by(
                ChatMessage.created_at.desc()
            ).limit(limit).all()
            
            # Format for AI service
            history = []
            for message in reversed(messages):  # Reverse to get chronological order
                history.append({
                    "role": message.role,
                    "content": message.content
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting conversation history: {str(e)}")
            return []
    
    async def generate_session_summary(
        self,
        db: Session,
        session_id: int,
        user_id: int
    ) -> str:
        """Generate a summary of the conversation session"""
        try:
            # Verify access
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Chat session not found or access denied")
            
            # Get conversation history
            history = await self._get_conversation_history(db, session_id, limit=50)
            
            # Generate summary using AI service
            summary = await self.ai_service.generate_conversation_summary(history)
            
            # Store summary in session metadata
            session.metadata = session.metadata or {}
            session.metadata["summary"] = summary
            session.metadata["summary_generated_at"] = datetime.now(timezone.utc).isoformat()
            
            db.commit()
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating session summary: {str(e)}")
            raise
    
    def get_session_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get user's chat statistics"""
        try:
            total_sessions = db.query(ChatSession).filter(
                ChatSession.user_id == user_id
            ).count()
            
            total_messages = db.query(ChatMessage).join(ChatSession).filter(
                ChatSession.user_id == user_id,
                ChatMessage.role == "user"
            ).count()
            
            total_ai_responses = db.query(ChatMessage).join(ChatSession).filter(
                ChatSession.user_id == user_id,
                ChatMessage.role == "ai"
            ).count()
            
            # Vector database stats
            vector_stats = self.vector_service.get_stats()
            
            return {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "total_ai_responses": total_ai_responses,
                "vector_database": vector_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting session stats: {str(e)}")
            return {"error": str(e)}
