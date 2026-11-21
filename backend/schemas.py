from typing import List, Optional, Any, Union
from datetime import datetime
from pydantic import BaseModel

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "client"  # "admin" or "client"
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_user(cls, user):
        if isinstance(user, dict):
            # Parse created_at if string
            data = user.copy()
            return cls(**data)
        if hasattr(cls, "model_validate"):
            return cls.model_validate(user)
        return cls.from_orm(user)

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Poll Schemas ---
class PollOptionCreate(BaseModel):
    text: str

class PollOptionResponse(BaseModel):
    id: str
    text: str
    vote_count: int = 0
    percentage: float = 0.0

    class Config:
        from_attributes = True

class PollCreate(BaseModel):
    question: str
    description: Optional[str] = None
    options: List[str]

class PollResponse(BaseModel):
    id: str
    post_id: Optional[str] = None
    post_title: Optional[str] = None
    question: str
    description: Optional[str] = None
    created_by: str
    created_at: Optional[datetime] = None
    options: List[PollOptionResponse]
    total_votes: int = 0
    user_voted_option_id: Optional[str] = None

    class Config:
        from_attributes = True

class VoteRequest(BaseModel):
    option_id: str

# --- Post Schemas ---
class PostCreate(BaseModel):
    title: str
    content: str
    media_urls: Optional[List[str]] = []
    media_type: Optional[str] = "none"  # "none", "image", "video", "mixed"
    is_featured: Optional[bool] = False
    poll: Optional[PollCreate] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None
    media_type: Optional[str] = None
    is_featured: Optional[bool] = None

class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    media_urls: List[str]
    media_type: str
    is_featured: bool = False
    author: UserResponse
    poll: Optional[PollResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

# --- Admin Client Management Schemas ---
class ClientResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "client"
    avatar_url: Optional[str] = None
    created_at: Optional[Any] = None
    votes_count: int = 0

    class Config:
        from_attributes = True

class ClientUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
