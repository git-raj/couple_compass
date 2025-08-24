from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Base schemas
class ChatSessionBase(BaseModel):
    title: str = Field(default="New Conversation", max_length=255)
    partner_user_id: Optional[int] = None
    session_type: str = Field(default="ai_mediation", max_length=50)
    topic: Optional[str] = Field(None, max_length=255)
    metadata: Optional[Dict[str, Any]] = None

class ChatMessageBase(BaseModel):
    content: str
    message_type: str = Field(default="text", max_length=50)
    role: str = Field(..., max_length=20)  # user, ai, partner, system
    metadata: Optional[Dict[str, Any]] = None
    parent_message_id: Optional[int] = None

# Create schemas
class ChatSessionCreate(ChatSessionBase):
    pass

class ChatMessageCreate(ChatMessageBase):
    session_id: int

class ChatMessageSend(BaseModel):
    content: str
    message_type: str = Field(default="text", max_length=50)
    parent_message_id: Optional[int] = None

# Response schemas
class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    is_edited: bool = False
    is_deleted: bool = False
    tokens_used: Optional[int] = None
    
    class Config:
        from_attributes = True

class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    status: str
    last_activity: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatSessionWithMessages(ChatSessionResponse):
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True

# AI-specific schemas
class AIResponse(BaseModel):
    message: str
    tokens_used: int
    confidence_score: Optional[float] = None
    suggested_actions: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatContextRequest(BaseModel):
    query: str
    session_id: int
    max_results: int = Field(default=5, ge=1, le=20)

class ConversationContextResponse(BaseModel):
    id: int
    session_id: int
    content: str
    content_type: str
    relevance_score: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# WebSocket schemas
class WSMessage(BaseModel):
    type: str  # message, typing, status
    session_id: int
    content: Optional[str] = None
    user_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class WSTypingIndicator(BaseModel):
    type: str = "typing"
    session_id: int
    user_id: int
    is_typing: bool
