from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import asyncio
import logging

from ..database import get_db
from ..models.user import User
from ..models.chat import ChatSession, ChatMessage
from ..schemas.chat import (
    ChatSessionCreate, ChatSessionResponse, ChatSessionWithMessages,
    ChatMessageSend, ChatMessageResponse, ChatContextRequest, 
    ConversationContextResponse, WSMessage, WSTypingIndicator
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
