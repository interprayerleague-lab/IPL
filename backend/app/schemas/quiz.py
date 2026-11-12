from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"


class AttemptStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


# Admin quiz management schemas
class QuestionCreate(BaseModel):
    question_text: str
    question_type: QuestionType
    options: Optional[Dict[str, Any]] = None
    correct_answer: Dict[str, Any]
    explanation: Optional[str] = None
    points: float = Field(default=1.0, gt=0)
    sequence_number: int = Field(gt=0)


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[Dict[str, Any]] = None
    correct_answer: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    points: Optional[float] = Field(None, gt=0)
    sequence_number: Optional[int] = Field(None, gt=0)


class QuizCreate(BaseModel):
    lesson_id: str
    title: str
    description: Optional[str] = None
    pass_mark: float = Field(default=70.0, ge=0, le=100)
    max_attempts: Optional[int] = Field(None, gt=0)
    is_published: bool = False


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pass_mark: Optional[float] = Field(None, ge=0, le=100)
    max_attempts: Optional[int] = Field(None, gt=0)
    is_published: Optional[bool] = None


# Student quiz schemas (safe - no correct_answer)
class QuestionSafeResponse(BaseModel):
    id: str
    question_text: str
    question_type: QuestionType
    options: Optional[Dict[str, Any]] = None
    points: float
    sequence_number: int


class QuizResponse(BaseModel):
    id: str
    lesson_id: str
    title: str
    description: Optional[str]
    pass_mark: float
    max_attempts: Optional[int]
    is_published: bool
    created_at: datetime
    questions: List[QuestionSafeResponse] = []


class QuizAttemptResponse(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    attempt_number: int
    score: Optional[float]
    passed: Optional[bool]
    status: AttemptStatus
    started_at: datetime
    submitted_at: Optional[datetime]


class AnswerSubmit(BaseModel):
    question_id: str
    answer: Dict[str, Any]


class QuizSubmission(BaseModel):
    answers: List[AnswerSubmit]


class QuizResultResponse(BaseModel):
    attempt_id: str
    quiz_id: str
    score: float
    passed: bool
    total_points: float
    earned_points: float
    status: str
    submitted_at: datetime
    feedback: List[Dict[str, Any]] = []  # Question-level feedback
