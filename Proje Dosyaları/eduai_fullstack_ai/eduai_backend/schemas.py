"""
Pydantic models for request and response schemas.

These models validate the input and output of API endpoints.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ExamSelection(BaseModel):
    exam_id: int = Field(..., description="ID of the selected exam")


class Questionnaire(BaseModel):
    learning_style: Optional[str] = Field(None, description="visual/auditory/kinesthetic")
    daily_hours: Optional[int] = Field(None, description="Number of study hours per day")
    difficult_topics: Optional[List[str]] = Field(None, description="List of topics user struggles with")


class MiniTestResponse(BaseModel):
    questions: List[Dict[str, Any]]


class MiniTestResult(BaseModel):
    answers: List[Dict[str, Any]]


class WeeklyPlanRequest(BaseModel):
    # For simplicity, we may allow starting date to be passed; otherwise current week is used
    week_start: Optional[str] = Field(None, description="ISO date string when the week starts")


class WeeklyPlanResponse(BaseModel):
    week_start: str
    subjects: List[Dict[str, Any]]
    tests: Optional[List[Dict[str, Any]]]


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    exams: List[str] = []
    questionnaire: Optional[Dict[str, Any]] = None


class ProgressRecord(BaseModel):
    id: int
    topic: str
    status: str
    score: Optional[float] = None


class AIInteractionRecord(BaseModel):
    id: int
    interaction_type: str
    # content and result can be arbitrary JSON (dict or list) or None
    content: Optional[Any] = None
    result: Optional[Any] = None
    timestamp: str


class ChatRequest(BaseModel):
    """Schema for chat endpoint.

    The frontend sends a free‑form message from the user and expects a
    string reply from the AI. Only a single field is required.
    """
    message: str


class WeeklyPlanRecord(BaseModel):
    id: int
    week_start: str
    subjects: List[Dict[str, Any]]
    tests: Optional[List[Dict[str, Any]]]
