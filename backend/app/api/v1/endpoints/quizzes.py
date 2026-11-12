from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.quiz import (
    QuizResponse,
    QuizAttemptResponse,
    QuizSubmission,
    QuizResultResponse,
)
from app.services.quiz_service import QuizService
from app.core.dependencies import StudentUserId

router = APIRouter()


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get quiz with questions (safe - no correct answers).
    Student only.
    """
    try:
        quiz = QuizService.get_quiz_with_questions(quiz_id, safe=True)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        if not quiz["is_published"]:
            raise HTTPException(status_code=403, detail="Quiz not available")

        return quiz
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{quiz_id}/start", response_model=QuizAttemptResponse)
def start_quiz(
    quiz_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Start a new quiz attempt.
    Student only.
    """
    try:
        attempt = QuizService.start_quiz_attempt(quiz_id, student_id)
        return attempt
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{quiz_id}/attempts/{attempt_id}/submit", response_model=QuizResultResponse)
def submit_quiz(
    quiz_id: str,
    attempt_id: str,
    submission: QuizSubmission,
    student_id: str = Depends(StudentUserId),
):
    """
    Submit quiz answers and receive graded result.
    Student only.
    """
    try:
        result = QuizService.submit_quiz(
            attempt_id, student_id, [a.dict() for a in submission.answers]
        )
        return result
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
def get_quiz_attempts(
    quiz_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get student's attempts for a quiz.
    Student only.
    """
    try:
        attempts = QuizService.get_student_attempts(quiz_id, student_id)
        return attempts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/attempts/{attempt_id}")
def get_attempt_result(
    attempt_id: str,
    student_id: str = Depends(StudentUserId),
):
    """
    Get detailed attempt result with feedback.
    Student only.
    """
    try:
        attempt = QuizService.get_attempt_with_answers(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        # Verify ownership
        if attempt["student_id"] != student_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        return attempt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
