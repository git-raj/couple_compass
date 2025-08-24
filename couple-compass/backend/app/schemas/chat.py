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
        
    @classmethod
    def from_orm(cls, obj):
        # Handle SQLAlchemy metadata properly
        data = {
            'id': obj.id,
            'session_id': obj.session_id,
            'user_id': obj.user_id,
            'role': obj.role,
            'content': obj.content,
            'message_type': obj.message_type,
            'metadata': obj.message_metadata if hasattr(obj, 'message_metadata') else {},
            'parent_message_id': obj.parent_message_id,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'is_edited': obj.is_edited,
            'is_deleted': obj.is_deleted,
            'tokens_used': obj.tokens_used
        }
        return cls(**data)

class ChatSessionResponse(ChatSessionBase):
    id: int
    user_id: int
    status: str
    last_activity: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        # Handle SQLAlchemy metadata properly
        data = {
            'id': obj.id,
            'title': obj.title,
            'user_id': obj.user_id,
            'partner_user_id': obj.partner_user_id,
            'session_type': obj.session_type,
            'status': obj.status,
            'topic': obj.topic,
            'metadata': obj.session_metadata if hasattr(obj, 'session_metadata') else {},
            'last_activity': obj.last_activity,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at
        }
        return cls(**data)

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

# Chat Invitation schemas
class ChatInvitationBase(BaseModel):
    session_id: int
    invitation_message: Optional[str] = None

class ChatInvitationCreate(ChatInvitationBase):
    pass

class ChatInvitationResponse(ChatInvitationBase):
    id: int
    inviter_id: int
    invitee_id: int
    status: str
    expires_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatInvitationAccept(BaseModel):
    invitation_id: int

class ChatInvitationDecline(BaseModel):
    invitation_id: int
    reason: Optional[str] = None

# Partner Status schemas
class PartnerStatus(BaseModel):
    user_id: int
    is_online: bool
    last_seen: Optional[datetime] = None
    is_in_session: bool = False

class SessionParticipants(BaseModel):
    session_id: int
    participants: List[Dict[str, Any]] = []
    partner_status: Optional[PartnerStatus] = None

# WebSocket schemas
class WSMessage(BaseModel):
    type: str  # message, typing, status, invitation, partner_joined, partner_left
    session_id: int
    content: Optional[str] = None
    user_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class WSTypingIndicator(BaseModel):
    type: str = "typing"
    session_id: int
    user_id: int
    is_typing: bool

class WSInvitationEvent(BaseModel):
    type: str = "invitation"
    invitation_id: int
    session_id: int
    inviter_id: int
    invitee_id: int
    status: str
    message: Optional[str] = None

class WSPartnerEvent(BaseModel):
    type: str  # partner_joined, partner_left, partner_online, partner_offline
    session_id: int
    partner_id: int
    partner_name: str
    message: Optional[str] = None
