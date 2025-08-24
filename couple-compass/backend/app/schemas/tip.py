from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class TipBase(BaseModel):
    content: str
    category: str

class TipCreate(TipBase):
    pass

class TipResponse(TipBase):
    id: int  # Changed from str to int to match database
    created_at: datetime
    
    class Config:
        from_attributes = True

class TipsHistoryResponse(BaseModel):
    tips: List[TipResponse]

class TipGenerateRequest(BaseModel):
    pass  # No additional parameters needed for now

class TipViewRequest(BaseModel):
    tip_id: int  # Changed from str to int to match database

class TipViewResponse(BaseModel):
    success: bool
    message: str
