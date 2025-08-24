from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class PartnerCodeGenerate(BaseModel):
    """Schema for generating a partner code"""
    pass  # No input required

class PartnerCodeResponse(BaseModel):
    """Response schema for generated partner code"""
    code: str
    expires_at: datetime
    message: str

class PartnerLinkRequest(BaseModel):
    """Schema for linking with partner using code"""
    code: str
    
    @validator('code')
    def validate_code_format(cls, v):
        if not v or len(v) != 6:
            raise ValueError('Code must be exactly 6 characters')
        if not v.isalnum():
            raise ValueError('Code must contain only letters and numbers')
        return v.upper()

class PartnerInfo(BaseModel):
    """Schema for partner information"""
    id: int
    name: str
    email: str
    linked_at: datetime
    
    class Config:
        from_attributes = True

class PartnerStatusResponse(BaseModel):
    """Response schema for partner status"""
    has_partner: bool
    partner: Optional[PartnerInfo] = None
    active_code: Optional[str] = None
    active_code_expires_at: Optional[datetime] = None

class PartnerLinkResponse(BaseModel):
    """Response schema for successful partner linking"""
    success: bool
    message: str
    partner: PartnerInfo

class PartnerUnlinkResponse(BaseModel):
    """Response schema for partner unlinking"""
    success: bool
    message: str
