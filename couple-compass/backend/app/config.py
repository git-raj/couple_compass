from pydantic_settings import BaseSettings
from typing import List, Optional
import os

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
    
    # External APIs
    openai_api_key: str = ""
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket: str = "couple-compass-media"
    
    # Vector Database (Pinecone)
    pinecone_api_key: str = ""
    pinecone_environment: str = "us-east-1-aws"
    
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
