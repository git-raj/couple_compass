from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path

# Load environment variables from root .env file
root_env_path = Path(__file__).parent.parent.parent.parent / ".env"
if root_env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(root_env_path)

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./couple_compass.db"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    
    # Security
    secret_key: str = "development-secret-key"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_password: Optional[str] = None
    
    # LLM Provider Configuration
    default_llm_provider: str = os.getenv("DEFAULT_LLM_PROVIDER", "openai")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
    openai_embeddings_model: str = os.getenv("OPENAI_EMBEDDINGS_MODEL", "text-embedding-3-small")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-pro")
    
    # AWS Configuration
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket: str = "couple-compass-media"
    
    # Vector Database (Pinecone)
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_environment: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1-aws")
    
    # Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # App settings
    environment: str = "development"
    debug: bool = False
    allowed_hosts: List[str] = ["localhost", "127.0.0.1", "*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings() -> Settings:
    return Settings()
