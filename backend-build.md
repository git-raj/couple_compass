# Couple Compass - Backend Build Guide

## Overview

This document provides comprehensive guidance for building the Couple Compass backend services using FastAPI (Python) or NestJS (TypeScript). The backend follows microservices architecture principles with domain-driven design, ensuring scalability, maintainability, and testability.

## Technology Stack

### Primary Framework Options

#### Option 1: FastAPI (Python) - Recommended
- **Framework**: FastAPI 0.104+
- **ASGI Server**: Uvicorn with Gunicorn for production
- **ORM**: SQLAlchemy 2.0 with Alembic migrations
- **Validation**: Pydantic v2
- **Authentication**: python-jose + passlib
- **Testing**: pytest + httpx
- **Background Tasks**: Celery with Redis

#### Option 2: NestJS (TypeScript)
- **Framework**: NestJS 10+
- **Runtime**: Node.js 18+
- **ORM**: Prisma or TypeORM
- **Validation**: class-validator + class-transformer
- **Authentication**: Passport.js + JWT
- **Testing**: Jest + Supertest
- **Background Tasks**: BullMQ with Redis

## Project Structure

### FastAPI Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py              # Configuration management
│   ├── database.py            # Database connection
│   ├── dependencies.py        # Dependency injection
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py           # Authentication middleware
│   │   ├── cors.py           # CORS middleware
│   │   └── logging.py        # Request logging
│   ├── models/               # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── couple.py
│   │   ├── quiz.py
│   │   ├── mood.py
│   │   ├── journal.py
│   │   └── tip.py
│   ├── schemas/              # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── quiz.py
│   │   ├── mood.py
│   │   └── common.py
│   ├── services/             # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── quiz_service.py
│   │   ├── mood_service.py
│   │   ├── ai_service.py
│   │   └── tips_service.py
│   ├── routers/              # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── couples.py
│   │   ├── quizzes.py
│   │   ├── moods.py
│   │   ├── journals.py
│   │   └── tips.py
│   ├── utils/               # Utility functions
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── email.py
│   │   └── file_storage.py
│   └── tests/              # Test files
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_users.py
│       └── test_services/
├── migrations/             # Alembic migrations
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml
```

## Database Models (SQLAlchemy)

### Base Model
```python
# app/models/base.py
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### User Models
```python
# app/models/user.py
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    auth_provider = Column(String(50), default="email")  # email, google, apple
    provider_id = Column(String(255))
    
    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    couple_memberships = relationship("CoupleMember", back_populates="user")
    mood_checkins = relationship("MoodCheckin", back_populates="user")
    journals = relationship("Journal", back_populates="user")
    quiz_results = relationship("QuizResult", back_populates="user")

class Profile(BaseModel):
    __tablename__ = "profiles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    name = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    pronouns = Column(String(50))
    birthdate = Column(DateTime)
    timezone = Column(String(50), default="UTC")
    onboarding_completed = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Couple(BaseModel):
    __tablename__ = "couples"
    
    status = Column(String(20), default="active")  # active, paused, ended
    anniversary_date = Column(DateTime)
    
    # Relationships
    members = relationship("CoupleMember", back_populates="couple")
    mood_checkins = relationship("MoodCheckin", back_populates="couple")
    journals = relationship("Journal", back_populates="couple")

class CoupleMember(BaseModel):
    __tablename__ = "couple_members"
    
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    role = Column(String(20), default="partner")  # partner, admin
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    couple = relationship("Couple", back_populates="members")
    user = relationship("User", back_populates="couple_memberships")

class PartnerLink(BaseModel):
    __tablename__ = "partner_links"
    
    code = Column(String(8), unique=True, nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"), nullable=True)
    status = Column(String(20), default="pending")  # pending, used, expired
    expires_at = Column(DateTime(timezone=True), nullable=False)
```

### Application Models
```python
# app/models/quiz.py
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import BaseModel

class Quiz(BaseModel):
    __tablename__ = "quizzes"
    
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # love_language, communication_style
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    
    # Relationships
    items = relationship("QuizItem", back_populates="quiz")
    results = relationship("QuizResult", back_populates="quiz")

class QuizItem(BaseModel):
    __tablename__ = "quiz_items"
    
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"))
    prompt = Column(Text, nullable=False)
    kind = Column(String(50), nullable=False)  # multiple_choice, scale, text
    options_json = Column(JSONB)  # Store options for multiple choice
    order_index = Column(Integer, default=0)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="items")

class QuizResult(BaseModel):
    __tablename__ = "quiz_results"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"))
    responses_json = Column(JSONB, nullable=False)  # User responses
    scores_json = Column(JSONB, nullable=False)     # Calculated scores
    
    # Relationships
    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("Quiz", back_populates="results")

# app/models/mood.py
class MoodCheckin(BaseModel):
    __tablename__ = "mood_checkins"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"))
    mood_level = Column(Integer, nullable=False)  # 1-5 scale
    notes = Column(Text)
    context_tags = Column(JSONB)  # Optional mood context tags
    
    # Relationships
    user = relationship("User", back_populates="mood_checkins")
    couple = relationship("Couple", back_populates="mood_checkins")

# app/models/journal.py
class Journal(BaseModel):
    __tablename__ = "journals"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    couple_id = Column(UUID(as_uuid=True), ForeignKey("couples.id"))
    content = Column(Text, nullable=False)
    visibility = Column(String(20), default="private")  # private, shared
    sentiment_score = Column(Integer)  # AI-analyzed sentiment
    themes = Column(JSONB)  # AI-extracted themes
    
    # Relationships
    user = relationship("User", back_populates="journals")
    couple = relationship("Couple", back_populates="journals")

class VoiceNote(BaseModel):
    __tablename__ = "voice_notes"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    s3_url = Column(Text, nullable=False)
    transcript = Column(Text)
    duration_seconds = Column(Integer)
    visibility = Column(String(20), default="private")
    
    # Relationships
    user = relationship("User")

# app/models/tip.py
class Tip(BaseModel):
    __tablename__ = "tips"
    
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100))
    tags = Column(JSONB)  # Array of tags
    trigger_conditions = Column(JSONB)  # Conditions for showing tip
    priority_score = Column(Integer, default=0)
    
class UserTip(BaseModel):
    __tablename__ = "user_tips"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tip_id = Column(UUID(as_uuid=True), ForeignKey("tips.id"))
    context_json = Column(JSONB)  # Why this tip was suggested
    status = Column(String(20), default="suggested")  # suggested, viewed, dismissed, helpful
    viewed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User")
    tip = relationship("Tip")
```

## Pydantic Schemas

### Base Schemas
```python
# app/schemas/common.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
import uuid

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class TimestampMixin(BaseSchema):
    created_at: datetime
    updated_at: Optional[datetime] = None

class UUIDMixin(BaseSchema):
    id: uuid.UUID

# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from .common import BaseSchema, UUIDMixin, TimestampMixin

class UserBase(BaseSchema):
    email: EmailStr
    is_active: bool = True

class UserCreate(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserUpdate(BaseSchema):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class User(UserBase, UUIDMixin, TimestampMixin):
    is_verified: bool
    auth_provider: str

class ProfileBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    pronouns: Optional[str] = None
    timezone: str = "UTC"

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    pronouns: Optional[str] = None
    birthdate: Optional[datetime] = None
    timezone: Optional[str] = None

class Profile(ProfileBase, UUIDMixin, TimestampMixin):
    user_id: uuid.UUID
    avatar_url: Optional[str] = None
    birthdate: Optional[datetime] = None
    onboarding_completed: bool

# app/schemas/auth.py
class Token(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(BaseSchema):
    sub: Optional[str] = None  # user id
    exp: Optional[int] = None

class LoginRequest(BaseSchema):
    email: EmailStr
    password: str

class SignupRequest(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)

class PasswordResetRequest(BaseSchema):
    email: EmailStr

class PasswordResetConfirm(BaseSchema):
    token: str
    new_password: str = Field(..., min_length=8)
```

## FastAPI Application Setup

### Main Application
```python
# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time

from .config import get_settings
from .database import engine, Base
from .middleware.auth import AuthMiddleware
from .middleware.logging import LoggingMiddleware
from .routers import auth, users, couples, quizzes, moods, journals, tips

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Couple Compass API",
    description="Backend API for the Couple Compass relationship app",
    version="1.0.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_hosts,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts
)

app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(couples.router, prefix="/api/v1/couples", tags=["couples"])
app.include_router(quizzes.router, prefix="/api/v1/quizzes", tags=["quizzes"])
app.include_router(moods.router, prefix="/api/v1/moods", tags=["moods"])
app.include_router(journals.router, prefix="/api/v1/journals", tags=["journals"])
app.include_router(tips.router, prefix="/api/v1/tips", tags=["tips"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

@app.get("/ready")
async def readiness_check():
    # Add database connection check
    try:
        # Simple database check
        from .database import get_db
        db = next(get_db())
        db.execute("SELECT 1")
        return {"status": "ready", "timestamp": time.time()}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "error": str(e)}
        )

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Resource not found"}
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"}
    )
```

### Configuration Management
```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 20
    
    # Security
    secret_key: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Redis
    redis_url: str
    redis_password: Optional[str] = None
    
    # External APIs
    openai_api_key: str
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket: str = "couple-compass-media"
    
    # Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # App settings
    environment: str = "development"
    debug: bool = False
    allowed_hosts: List[str] = ["localhost", "127.0.0.1"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings() -> Settings:
    return Settings()
```

### Database Configuration
```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,  # Enable connection health checks
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Authentication & Authorization

### JWT Authentication
```python
# app/utils/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from .config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models.user import User
from .utils.security import verify_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
```

## Service Layer Implementation

### Authentication Service
```python
# app/services/auth_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User, Profile
from ..schemas.auth import SignupRequest, LoginRequest
from ..utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from typing import Dict, Optional

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    async def signup(self, signup_data: SignupRequest) -> Dict[str, str]:
        # Check if user already exists
        existing_user = self.db.query(User).filter(
            User.email == signup_data.email
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = get_password_hash(signup_data.password)
        user = User(
            email=signup_data.email,
            hashed_password=hashed_password,
            auth_provider="email"
        )
        
        self.db.add(user)
        self.db.flush()  # Get the user ID
        
        # Create profile
        profile = Profile(
            user_id=user.id,
            name=signup_data.name
        )
        
        self.db.add(profile)
        self.db.commit()
        
        # Generate tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    async def login(self, login_data: LoginRequest) -> Dict[str, str]:
        user = self.db.query(User).filter(
            User.email == login_data.email
        ).first()
        
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
```

### Quiz Service
```python
# app/services/quiz_service.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..models.quiz import Quiz, QuizItem, QuizResult
from ..models.user import User
import json

class QuizService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_active_quizzes(self) -> List[Quiz]:
        return self.db.query(Quiz).filter(Quiz.is_active == True).order_by(Quiz.order_index).all()
    
    def get_quiz_by_slug(self, slug: str) -> Quiz:
        quiz = self.db.query(Quiz).filter(Quiz.slug == slug).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return quiz
    
    def submit_quiz_result(self, user_id: str, quiz_id: str, responses: Dict[str, Any]) -> QuizResult:
        quiz = self.db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Calculate scores based on quiz type
        scores = self._calculate_scores(quiz, responses)
        
        # Check if user already has a result for this quiz
        existing_result = self.db.query(QuizResult).filter(
            QuizResult.user_id == user_id,
            QuizResult.quiz_id == quiz_id
        ).first()
        
        if existing_result:
            # Update existing result
            existing_result.responses_json = responses
            existing_result.scores_json = scores
            result = existing_result
        else:
            # Create new result
            result = QuizResult(
                user_id=user_id,
                quiz_id=quiz_id,
                responses_json=responses,
                scores_json=scores
            )
            self.db.add(result)
        
        self.db.commit()
        return result
    
    def _calculate_scores(self, quiz: Quiz, responses: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate quiz scores based on quiz type and responses"""
        if quiz.type == "love_language":
            return self._calculate_love_language_scores(responses)
        elif quiz.type == "communication_style":
            return self._calculate_communication_scores(responses)
        else:
            return {}
    
    def _calculate_love_language_scores(self, responses: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate love language scores"""
        categories = {
            "words_of_affirmation": 0,
            "quality_time": 0,
            "physical_touch": 0,
            "acts_of_service": 0,
            "receiving_gifts": 0
        }
        
        for question, answer in responses.items():
            if isinstance(answer, str) and answer in categories:
                categories[answer] += 1
        
        # Determine primary and secondary love languages
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "scores": categories,
            "primary": sorted_categories[0][0],
            "secondary": sorted_categories[1][0] if len(sorted_categories) > 1 else None,
            "percentages": {
                k: round((v / sum(categories.values())) * 100, 1) 
                for k, v in categories.items()
            }
        }
```

### AI Service
```python
# app/services/ai_service.py
import openai
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..config import get_settings
from ..models.journal import Journal
from ..models.tip import Tip, UserTip

settings = get_settings()
openai.api_key = settings.openai_api_key

class AIService:
    def __init__(self, db: Session):
        self.db = db
    
    async def analyze_journal_entry(self, journal: Journal) -> Dict[str, Any]:
        """Analyze journal entry for sentiment and themes"""
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a relationship counseling AI. Analyze the following journal entry and return JSON with sentiment (1-5 scale) and up to 3 main themes."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this journal entry: {journal.content}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            # Parse JSON response
            import json
            analysis = json.loads(result)
            
            # Update journal with analysis
            journal.sentiment_score = analysis.get("sentiment", 3)
            journal.themes = analysis.get("themes", [])
            self.db.commit()
            
            return analysis
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            return {"sentiment": 3, "themes": []}
    
    async def generate_personalized_tips(self, user_id: str) -> List[UserTip]:
        """Generate personalized tips based on user data"""
        # Get user's recent data
        recent_journals = self.db.query(Journal).filter(
            Journal.user_id == user_id
        ).order_by(Journal.created_at.desc()).limit(5).all()
        
        # Get quiz results
        from ..models.quiz import QuizResult
        quiz_results = self.db.query(QuizResult).filter(
            QuizResult.user_id == user_id
        ).all()
        
        # Simple rule-based tip generation (can be enhanced with AI)
        suggested_tips = self._generate_rule_based_tips(recent_journals, quiz_results)
        
        # Create UserTip records
        user_tips = []
        for tip_id, context in suggested_tips:
            user_tip = UserTip(
                user_id=user_id,
                tip_id=tip_id,
                context_json=context,
                status="suggested"
            )
            self.db.add(user_tip)
            user_tips.append(user_tip)
        
        self.db.commit()
        return user_tips
    
    def _generate_rule_based_tips(
        self, 
        journals: List[Journal], 
        quiz_results: List[QuizResult]
    ) -> List[tuple]:
        """Generate tips based on rules and patterns"""
        tips = []
        
        # Analyze recent mood patterns
        if journals:
            avg_sentiment = sum(j.sentiment_score or 3 for j in journals) / len(journals)
            if avg_sentiment < 2.5:
                # Suggest stress management tips
                stress_tips = self.db.query(Tip).filter(
                    Tip.category == "stress_management"
                ).limit(2).all()
                for tip in stress_tips:
                    tips.append((tip.id, {"reason": "recent_low_mood"}))
        
        # Analyze love language compatibility
        for result in quiz_results:
            if result.quiz.type == "love_language":
                primary_language = result.scores_json.get("primary")
                if primary_language:
                    language_tips = self.db.query(Tip).filter(
                        Tip.tags.contains([primary_language])
                    ).limit(1).all()
                    for tip in language_tips:
                        tips.append((tip.id, {"reason": "love_language_match", "language": primary_language}))
        
        return tips
```

## API Routes Implementation

### Authentication Routes
```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.auth import LoginRequest, SignupRequest, Token
from ..services.auth_service import AuthService

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(
    signup_data: SignupRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.signup(signup_data)

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.login(login_data)

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    from ..utils.security import verify_token, create_access_token
    
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Verify user exists and is active
    from ..models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
```

### Quiz Routes
```python
# app/routers/quizzes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.user import User
from ..schemas.quiz import QuizResponse, QuizResultCreate, QuizResultResponse
from ..services.quiz_service import QuizService
from ..dependencies import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[QuizResponse])
async def get_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    quiz_service = QuizService(db)
    return quiz_service.get_active_quizzes()

@router.get("/{quiz_slug}", response_model=QuizResponse)
async def get_quiz(
    quiz_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    quiz_service = QuizService(db)
    return quiz_service.get_quiz_by_slug(quiz_slug)

@router.post("/{quiz_id}/results", response_model=QuizResultResponse)
async def submit_quiz_result(
    quiz_id: str,
    result_data: QuizResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    quiz_service = QuizService(db)
    return quiz_service.submit_quiz_result(
        str(current_user.id),
        quiz_id,
        result_data.responses
    )
```

## Background Tasks with Celery

### Celery Configuration
```python
# app/celery_app.py
from celery import Celery
from .config import get_settings

settings = get_settings()

celery_app = Celery(
    "couple_compass",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# app/tasks.py
from celery import current_task
from .celery_app import celery_app
from .database import SessionLocal
from .services.ai_service import AIService
from .models.journal import Journal

@celery_app.task(bind=True)
def analyze_journal_task(self, journal_id: str):
    """Background task to analyze journal entry"""
    db = SessionLocal()
    try:
        journal = db.query(Journal).filter(Journal.id == journal_id).first()
        if journal:
            ai_service = AIService(db)
            result = ai_service.analyze_journal_entry(journal)
            return {"status": "completed", "result": result}
        return {"status": "error", "message": "Journal not found"}
    except Exception as e:
        self.retry(countdown=60, max_retries=3)
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task
def generate_daily_tips():
    """Daily task to generate personalized tips for all users"""
    db = SessionLocal()
    try:
        from .models.user import User
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            ai_service = AIService(db)
            tips = ai_service.generate_personalized_tips(str(user.id))
            print(f"Generated {len(tips)} tips for user {user.email}")
        
        return {"status": "completed", "users_processed": len(users)}
    finally:
        db.close()
```

## Testing Strategy

### Test Configuration
```python
# app/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..main import app
from ..database import get_db, Base
from ..models.user import User, Profile

# Test database URL - use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db):
    from ..utils.security import get_password_hash
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.flush()
    
    profile = Profile(
        user_id=user.id,
        name="Test User"
    )
    db.add(profile)
    db.commit()
    
    return user

# app/tests/test_auth.py
def test_signup(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "newuser@example.com",
            "password": "securepassword",
            "name": "New User"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == 401
```

## Requirements and Dependencies

### requirements.txt
```txt
fastapi[all]==0.104.1
uvicorn[standard]==0.24.0
gunicorn==21.2.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.8
pydantic==2.5.0
pydantic-settings==2.0.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
celery[redis]==5.3.4
redis==5.0.1
openai==1.3.7
boto3==1.34.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
python-dotenv==1.0.0
```

This backend build guide provides a comprehensive foundation for implementing the Couple Compass backend with robust authentication, data modeling, business logic, and testing strategies. The architecture is designed to be scalable, maintainable, and secure while providing the necessary APIs for the frontend applications.
