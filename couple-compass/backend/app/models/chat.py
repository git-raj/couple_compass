from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, JSON, func
from sqlalchemy.orm import relationship
from .base import BaseModel
from .user import User

class ChatSession(BaseModel):
    __tablename__ = "chat_sessions"
    
    title = Column(String(255), nullable=False, default="New Conversation")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    partner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional - for couple chats
    session_type = Column(String(50), default="ai_mediation")  # ai_mediation, couple_chat, etc.
    status = Column(String(50), default="active")  # active, archived, ended
    topic = Column(String(255))  # Main topic of conversation
    session_metadata = Column(JSON)  # Store additional session metadata
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="chat_sessions")
    partner = relationship("User", foreign_keys=[partner_user_id])
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    contexts = relationship("ConversationContext", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"
    
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for AI messages
    role = Column(String(20), nullable=False)  # user, ai, partner, system
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text")  # text, image, file, etc.
    message_metadata = Column(JSON)  # Store additional message metadata
    parent_message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)  # For threaded conversations
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    tokens_used = Column(Integer)  # For AI responses
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User")
    parent_message = relationship("ChatMessage", remote_side="ChatMessage.id")
    replies = relationship("ChatMessage", remote_side="ChatMessage.parent_message_id")

class ConversationContext(BaseModel):
    __tablename__ = "conversation_contexts"
    
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)  # The text content to be embedded
    embedding_vector = Column(JSON)  # Store the vector embedding as JSON
    content_type = Column(String(50), default="message")  # message, summary, insight, etc.
    source_message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    relevance_score = Column(Integer, default=100)  # 0-100 relevance score
    context_metadata = Column(JSON)
    
    # Relationships
    session = relationship("ChatSession", back_populates="contexts")
    source_message = relationship("ChatMessage")

# Update User model to include chat relationships
User.chat_sessions = relationship("ChatSession", foreign_keys="ChatSession.user_id", back_populates="user")
