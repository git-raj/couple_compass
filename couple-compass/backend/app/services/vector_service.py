import pinecone
from typing import List, Dict, Any, Optional
import uuid
import json
import logging
from ..config import get_settings
from .ai_service import AIService

settings = get_settings()
logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        self.index_name = "couple-compass-conversations"
        self.dimension = 1536  # OpenAI text-embedding-3-small dimension
        self.ai_service = AIService()
        self._initialize_pinecone()
    
    def _initialize_pinecone(self):
        """Initialize Pinecone connection"""
        try:
            # Initialize Pinecone
            pinecone.init(
                api_key=settings.pinecone_api_key,
                environment=settings.pinecone_environment
            )
            
            # Create index if it doesn't exist
            if self.index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine"
                )
            
            self.index = pinecone.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")
            self.index = None
    
    async def store_conversation_context(
        self,
        session_id: int,
        content: str,
        content_type: str = "message",
        user_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Store conversation content as embeddings in vector database"""
        try:
            if not self.index:
                logger.warning("Pinecone index not available")
                return False
            
            # Generate embedding
            embedding = await self.ai_service.get_embeddings(content)
            if not embedding:
                logger.error("Failed to generate embedding")
                return False
            
            # Prepare metadata
            vector_metadata = {
                "session_id": session_id,
                "content": content[:1000],  # Pinecone metadata limit
                "content_type": content_type,
                "user_id": user_id or 0,
                "timestamp": str(metadata.get("timestamp")) if metadata else None,
                **(metadata or {})
            }
            
            # Create unique ID
            vector_id = f"session_{session_id}_{uuid.uuid4().hex[:8]}"
            
            # Store in Pinecone
            self.index.upsert(vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": vector_metadata
            }])
            
            logger.info(f"Stored vector {vector_id} for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing conversation context: {str(e)}")
            return False
    
    async def search_relevant_context(
        self,
        query: str,
        session_id: int,
        limit: int = 5,
        min_score: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for relevant conversation context using RAG"""
        try:
            if not self.index:
                logger.warning("Pinecone index not available")
                return []
            
            # Generate query embedding
            query_embedding = await self.ai_service.get_embeddings(query)
            if not query_embedding:
                return []
            
            # Search for similar contexts
            search_response = self.index.query(
                vector=query_embedding,
                top_k=limit,
                filter={"session_id": session_id},
                include_metadata=True
            )
            
            # Filter by minimum score and format results
            results = []
            for match in search_response.matches:
                if match.score >= min_score:
                    results.append({
                        "id": match.id,
                        "content": match.metadata.get("content", ""),
                        "content_type": match.metadata.get("content_type", "message"),
                        "relevance_score": round(match.score * 100),
                        "metadata": {
                            k: v for k, v in match.metadata.items() 
                            if k not in ["content", "content_type", "session_id"]
                        }
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching relevant context: {str(e)}")
            return []
    
    async def get_conversation_summary_context(
        self,
        session_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent conversation context for building AI responses"""
        try:
            if not self.index:
                return []
            
            # Query for recent messages in the session
            search_response = self.index.query(
                vector=[0.0] * self.dimension,  # Dummy vector for metadata-only search
                top_k=limit,
                filter={"session_id": session_id},
                include_metadata=True
            )
            
            # Sort by timestamp and return
            contexts = []
            for match in search_response.matches:
                contexts.append({
                    "content": match.metadata.get("content", ""),
                    "content_type": match.metadata.get("content_type", "message"),
                    "user_id": match.metadata.get("user_id"),
                    "timestamp": match.metadata.get("timestamp")
                })
            
            # Sort by timestamp if available
            contexts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return contexts[:limit]
            
        except Exception as e:
            logger.error(f"Error getting conversation summary: {str(e)}")
            return []
    
    async def delete_session_context(self, session_id: int) -> bool:
        """Delete all vector data for a session"""
        try:
            if not self.index:
                return False
            
            # Query to get all vectors for the session
            search_response = self.index.query(
                vector=[0.0] * self.dimension,
                top_k=10000,  # Large number to get all
                filter={"session_id": session_id},
                include_metadata=False
            )
            
            # Extract IDs and delete
            vector_ids = [match.id for match in search_response.matches]
            if vector_ids:
                self.index.delete(ids=vector_ids)
                logger.info(f"Deleted {len(vector_ids)} vectors for session {session_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting session context: {str(e)}")
            return False
    
    async def update_context_relevance(
        self,
        vector_id: str,
        relevance_score: int
    ) -> bool:
        """Update relevance score for a specific context"""
        try:
            if not self.index:
                return False
            
            # Fetch existing vector
            fetch_response = self.index.fetch(ids=[vector_id])
            if vector_id not in fetch_response.vectors:
                return False
            
            vector_data = fetch_response.vectors[vector_id]
            updated_metadata = vector_data.metadata.copy()
            updated_metadata["relevance_score"] = relevance_score
            
            # Update vector with new metadata
            self.index.upsert(vectors=[{
                "id": vector_id,
                "values": vector_data.values,
                "metadata": updated_metadata
            }])
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating context relevance: {str(e)}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector database statistics"""
        try:
            if not self.index:
                return {"error": "Index not available"}
            
            stats = self.index.describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": dict(stats.namespaces) if stats.namespaces else {}
            }
            
        except Exception as e:
            logger.error(f"Error getting vector stats: {str(e)}")
            return {"error": str(e)}
