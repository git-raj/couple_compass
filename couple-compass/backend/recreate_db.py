import os
import sys

# Add the app directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.base import Base
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage, ConversationContext

# Drop all tables
Base.metadata.drop_all(bind=engine)
print("All tables dropped.")

# Create all tables
Base.metadata.create_all(bind=engine)
print("All tables created with updated schema.")
