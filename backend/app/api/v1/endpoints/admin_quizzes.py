from fastapi import APIRouter, Depends, HTTPException
from app.schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuestionCreate,
    QuestionUpdate,
)
from app.services.quiz_service import QuizService
from app.services.admin_service import AdminService
from app.core.dependencies import AdminUserId

router = APIRouter()


# QUIZZES
@router.post("/quizzes")
def create_quiz(
    data: QuizCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create quiz. Admin only."""
    try:
        quiz = QuizService.create_quiz(data.dict())
        AdminService.log_action(admin_id, "create_quiz", "quiz", quiz["id"])
        return quiz
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: str,
    data: QuizUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update quiz. Admin only."""
    try:
        quiz = QuizService.update_quiz(quiz_id, data.dict(exclude_unset=True))
        AdminService.log_action(admin_id, "update_quiz", "quiz", quiz_id)
        return quiz
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Delete quiz. Admin only."""
    try:
        success = QuizService.delete_quiz(quiz_id)
        if success:
            AdminService.log_action(admin_id, "delete_quiz", "quiz", quiz_id)
            return {"message": "Quiz deleted successfully"}
        raise HTTPException(status_code=404, detail="Quiz not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/quizzes/{quiz_id}")
def get_quiz_admin(
    quiz_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Get quiz with all questions (including correct answers). Admin only."""
    try:
        quiz = QuizService.get_quiz_with_questions(quiz_id, safe=False)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return quiz
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


# QUESTIONS
@router.post("/questions")
def create_question(
    data: QuestionCreate,
    admin_id: str = Depends(AdminUserId),
):
    """Create question. Admin only."""
    try:
        question = QuizService.create_question(data.dict())
        AdminService.log_action(admin_id, "create_question", "question", question["id"])
        return question
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/questions/{question_id}")
def update_question(
    question_id: str,
    data: QuestionUpdate,
    admin_id: str = Depends(AdminUserId),
):
    """Update question. Admin only."""
    try:
        question = QuizService.update_question(question_id, data.dict(exclude_unset=True))
        AdminService.log_action(admin_id, "update_question", "question", question_id)
        return question
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: str,
    admin_id: str = Depends(AdminUserId),
):
    """Delete question. Admin only."""
    try:
        success = QuizService.delete_question(question_id)
        if success:
            AdminService.log_action(admin_id, "delete_question", "question", question_id)
            return {"message": "Question deleted successfully"}
        raise HTTPException(status_code=404, detail="Question not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
