"""
Pydantic models for request validation and response shaping.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ---------------- AUTH ----------------
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------------- REPOSITORIES ----------------
class RepositoryFilter(BaseModel):
    language: Optional[str] = None
    min_stars: int = 0
    difficulty: Optional[str] = None
    keywords: Optional[str] = None
    page: int = 1
    page_size: int = 20


# ---------------- RECOMMENDATIONS ----------------
class RecommendRequest(BaseModel):
    skills: List[str] = Field(default_factory=list)
    language: Optional[str] = None
    difficulty: Optional[str] = None


# ---------------- ALERTS ----------------
class AlertCreateRequest(BaseModel):
    language: Optional[str] = None
    minimum_stars: int = 0
    keywords: Optional[str] = None


# ---------------- SAVED ----------------
class SaveProjectRequest(BaseModel):
    repository_id: str


# ---------------- JOBS ----------------
class JobFilter(BaseModel):
    remote: Optional[bool] = None
    location: Optional[str] = None
    tech: Optional[str] = None
    page: int = 1
    page_size: int = 20
