from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import asyncio
import logging

from ..database import get_db
from ..models.user import User
from ..models.chat import ChatSession, ChatMessage, ChatInvitation
from ..schemas.chat import (
    ChatSessionCreate, ChatSessionResponse, ChatSessionWithMessages,
    ChatMessageSend, ChatMessageResponse, ChatContextRequest, 
    ConversationContextResponse, WSMessage, WSTypingIndicator,
    ChatInvitationCreate, ChatInvitationResponse, ChatInvitationAccept,
    ChatInvitationDecline, PartnerStatus, SessionParticipants,
    WSInvitationEvent, WSPartnerEvent
)
from ..services.chat_service import ChatService
from ..utils.security import verify_token

router = APIRouter(prefix="/chat", tags=["chat"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected to WebSocket")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove broken connections
                    self.active_connections[user_id].remove(connection)
    
    async def broadcast_to_session(self, message: str, session_id: int, sender_user_id: int = None):
        # In a more complex implementation, you'd track which users are in which sessions
        # For now, we'll just send to all connected users
        for user_id, connections in self.active_connections.items():
            if sender_user_id and user_id == sender_user_id:
                continue  # Don't echo back to sender
            for connection in connections:
                try:
                    await connection.send_text(message)
                except:
                    connections.remove(connection)

manager = ConnectionManager()

# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    try:
        payload = verify_token(credentials.credentials)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

# Initialize chat service
chat_service = ChatService()

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    try:
        return await chat_service.create_chat_session(
            db=db,
            user_id=current_user.id,
            session_data=session_data
        )
    except Exception as e:
        logger.error(f"Error creating chat session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create chat session")

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's chat sessions"""
    try:
        return await chat_service.get_chat_sessions(
            db=db,
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Error getting chat sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chat sessions")

@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific chat session with messages"""
    try:
        # Get session
        sessions = await chat_service.get_chat_sessions(db=db, user_id=current_user.id)
        session = next((s for s in sessions if s.id == session_id), None)
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Get messages
        messages = await chat_service.get_chat_history(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        
        # Return session with messages
        return ChatSessionWithMessages(
            **session.dict(),
            messages=messages
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chat session")

@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    message_data: ChatMessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response"""
    try:
        result = await chat_service.send_message(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            message_data=message_data
        )
        
        # Broadcast message via WebSocket
        ws_message = WSMessage(
            type="message",
            session_id=session_id,
            content=result["ai_response"].content,
            user_id=None,  # AI message
            metadata={
                "role": "ai",
                "suggested_actions": result["suggested_actions"],
                "confidence_score": result["confidence_score"]
            }
        )
        
        await manager.broadcast_to_session(
            message=ws_message.json(),
            session_id=session_id,
            sender_user_id=current_user.id
        )
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/sessions/{session_id}/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    session_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    try:
        return await chat_service.get_chat_history(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chat history")

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session"""
    try:
        success = await chat_service.delete_chat_session(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete session")
        
        return {"message": "Chat session deleted successfully"}
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting chat session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete chat session")

@router.put("/sessions/{session_id}/title", response_model=ChatSessionResponse)
async def update_session_title(
    session_id: int,
    title_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update chat session title"""
    try:
        title = title_data.get("title", "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        return await chat_service.update_session_title(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            title=title
        )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating session title: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update session title")

@router.post("/sessions/{session_id}/summary")
async def generate_session_summary(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a summary of the conversation session"""
    try:
        summary = await chat_service.generate_session_summary(
            db=db,
            session_id=session_id,
            user_id=current_user.id
        )
        
        return {"summary": summary}
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating session summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")

@router.get("/stats")
async def get_chat_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's chat statistics"""
    try:
        return chat_service.get_session_stats(db=db, user_id=current_user.id)
    except Exception as e:
        logger.error(f"Error getting chat stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get chat statistics")

# Partner invitation endpoints
@router.post("/sessions/{session_id}/invite-partner", response_model=ChatInvitationResponse)
async def invite_partner_to_session(
    session_id: int,
    invitation_data: ChatInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send invitation to partner to join chat session"""
    try:
        # Check if user has a partner
        if not current_user.partner_id:
            raise HTTPException(status_code=400, detail="You don't have a linked partner")
        
        # Check if session exists and belongs to user
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Check if partner is already in the session
        if session.partner_user_id == current_user.partner_id:
            raise HTTPException(status_code=400, detail="Partner is already in this session")
        
        # Check for existing pending invitation
        existing_invitation = db.query(ChatInvitation).filter(
            ChatInvitation.session_id == session_id,
            ChatInvitation.inviter_id == current_user.id,
            ChatInvitation.invitee_id == current_user.partner_id,
            ChatInvitation.status == "pending"
        ).first()
        
        if existing_invitation:
            raise HTTPException(status_code=400, detail="Partner invitation already pending")
        
        # Create invitation
        from datetime import datetime, timedelta
        invitation = ChatInvitation(
            session_id=session_id,
            inviter_id=current_user.id,
            invitee_id=current_user.partner_id,
            invitation_message=invitation_data.invitation_message,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        # Send WebSocket notification to partner
        ws_event = WSInvitationEvent(
            invitation_id=invitation.id,
            session_id=session_id,
            inviter_id=current_user.id,
            invitee_id=current_user.partner_id,
            status="pending",
            message=f"{current_user.name} invited you to join a chat session"
        )
        
        await manager.send_personal_message(
            message=ws_event.json(),
            user_id=current_user.partner_id
        )
        
        return ChatInvitationResponse(
            id=invitation.id,
            session_id=invitation.session_id,
            inviter_id=invitation.inviter_id,
            invitee_id=invitation.invitee_id,
            status=invitation.status,
            invitation_message=invitation.invitation_message,
            expires_at=invitation.expires_at,
            responded_at=invitation.responded_at,
            created_at=invitation.created_at,
            updated_at=invitation.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting partner: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to invite partner")

@router.get("/invitations", response_model=List[ChatInvitationResponse])
async def get_chat_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pending chat invitations for current user"""
    try:
        invitations = db.query(ChatInvitation).filter(
            ChatInvitation.invitee_id == current_user.id,
            ChatInvitation.status == "pending"
        ).all()
        
        return [ChatInvitationResponse(
            id=inv.id,
            session_id=inv.session_id,
            inviter_id=inv.inviter_id,
            invitee_id=inv.invitee_id,
            status=inv.status,
            invitation_message=inv.invitation_message,
            expires_at=inv.expires_at,
            responded_at=inv.responded_at,
            created_at=inv.created_at,
            updated_at=inv.updated_at
        ) for inv in invitations]
    
    except Exception as e:
        logger.error(f"Error getting invitations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get invitations")

@router.post("/invitations/{invitation_id}/accept")
async def accept_chat_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a chat invitation"""
    try:
        # Get invitation
        invitation = db.query(ChatInvitation).filter(
            ChatInvitation.id == invitation_id,
            ChatInvitation.invitee_id == current_user.id,
            ChatInvitation.status == "pending"
        ).first()
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Check if invitation expired
        from datetime import datetime
        if invitation.expires_at and datetime.utcnow() > invitation.expires_at:
            invitation.status = "expired"
            db.commit()
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Update session to include partner
        session = db.query(ChatSession).filter(ChatSession.id == invitation.session_id).first()
        if session:
            session.partner_user_id = current_user.id
            session.session_type = "couple_chat"
        
        # Update invitation status
        invitation.status = "accepted"
        invitation.responded_at = datetime.utcnow()
        
        db.commit()
        
        # Send WebSocket notification to both users
        partner_event = WSPartnerEvent(
            type="partner_joined",
            session_id=invitation.session_id,
            partner_id=current_user.id,
            partner_name=current_user.name,
            message=f"{current_user.name} joined the chat session"
        )
        
        # Notify inviter
        await manager.send_personal_message(
            message=partner_event.json(),
            user_id=invitation.inviter_id
        )
        
        # Broadcast to session
        await manager.broadcast_to_session(
            message=partner_event.json(),
            session_id=invitation.session_id
        )
        
        return {"message": "Invitation accepted successfully", "session_id": invitation.session_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to accept invitation")

@router.post("/invitations/{invitation_id}/decline")
async def decline_chat_invitation(
    invitation_id: int,
    decline_data: ChatInvitationDecline,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline a chat invitation"""
    try:
        # Get invitation
        invitation = db.query(ChatInvitation).filter(
            ChatInvitation.id == invitation_id,
            ChatInvitation.invitee_id == current_user.id,
            ChatInvitation.status == "pending"
        ).first()
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Update invitation status
        from datetime import datetime
        invitation.status = "declined"
        invitation.responded_at = datetime.utcnow()
        
        db.commit()
        
        # Send WebSocket notification to inviter
        ws_event = WSInvitationEvent(
            invitation_id=invitation.id,
            session_id=invitation.session_id,
            inviter_id=invitation.inviter_id,
            invitee_id=current_user.id,
            status="declined",
            message=f"{current_user.name} declined your chat invitation"
        )
        
        await manager.send_personal_message(
            message=ws_event.json(),
            user_id=invitation.inviter_id
        )
        
        return {"message": "Invitation declined"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error declining invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to decline invitation")

@router.get("/sessions/{session_id}/participants", response_model=SessionParticipants)
async def get_session_participants(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get participants in a chat session"""
    try:
        # Check if session exists and user has access
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id
        ).filter(
            (ChatSession.user_id == current_user.id) | 
            (ChatSession.partner_user_id == current_user.id)
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        participants = []
        partner_status = None
        
        # Add session owner
        participants.append({
            "user_id": session.user_id,
            "name": session.user.name,
            "role": "owner",
            "is_online": True  # Placeholder - implement real online tracking
        })
        
        # Add partner if present
        if session.partner_user_id and session.partner:
            partner_info = {
                "user_id": session.partner_user_id,
                "name": session.partner.name,
                "role": "partner",
                "is_online": True  # Placeholder - implement real online tracking
            }
            participants.append(partner_info)
            
            partner_status = PartnerStatus(
                user_id=session.partner_user_id,
                is_online=True,  # Placeholder
                is_in_session=True
            )
        
        return SessionParticipants(
            session_id=session_id,
            participants=participants,
            partner_status=partner_status
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session participants: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get session participants")

# WebSocket endpoint
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time chat"""
    try:
        # In a production environment, you'd want to authenticate the WebSocket connection
        # For now, we'll just use the user_id from the URL
        await manager.connect(websocket, user_id)
        
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data.get("type") == "typing":
                    # Broadcast typing indicator
                    typing_msg = WSTypingIndicator(
                        session_id=message_data["session_id"],
                        user_id=user_id,
                        is_typing=message_data["is_typing"]
                    )
                    await manager.broadcast_to_session(
                        message=typing_msg.json(),
                        session_id=message_data["session_id"],
                        sender_user_id=user_id
                    )
                
                elif message_data.get("type") == "ping":
                    # Send pong response
                    await websocket.send_text(json.dumps({"type": "pong"}))
                
                # Add other message type handlers as needed
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket connection: {str(e)}")
                break
    
    except Exception as e:
        logger.error(f"Error establishing WebSocket connection: {str(e)}")
    
    finally:
        manager.disconnect(websocket, user_id)
