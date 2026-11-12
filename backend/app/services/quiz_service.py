from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import supabase_admin


class QuizService:
    """Service for quiz management and grading"""

    # STUDENT OPERATIONS
    @staticmethod
    def get_quiz(quiz_id: str) -> Optional[dict]:
        """Get quiz by ID (admin view with all data)"""
        result = (
            supabase_admin.table("quizzes")
            .select("*")
            .eq("id", quiz_id)
            .single()
            .execute()
        )
        return result.data if result.data else None

    @staticmethod
    def get_quiz_with_questions(quiz_id: str, safe: bool = True) -> Optional[dict]:
        """Get quiz with questions. If safe=True, exclude correct_answer"""
        quiz = QuizService.get_quiz(quiz_id)
        if not quiz:
            return None

        # Get questions
        questions_result = (
            supabase_admin.table("questions")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("sequence_number")
            .execute()
        )

        questions = questions_result.data or []

        # Remove correct_answer if safe mode
        if safe:
            for q in questions:
                q.pop("correct_answer", None)
                q.pop("explanation", None)  # Don't show until after submission

        quiz["questions"] = questions
        return quiz

    @staticmethod
    def start_quiz_attempt(quiz_id: str, student_id: str) -> dict:
        """Start a new quiz attempt"""
        quiz = QuizService.get_quiz(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")

        if not quiz["is_published"]:
            raise ValueError("Quiz is not published")

        # Check max attempts
        if quiz["max_attempts"]:
            existing_attempts = (
                supabase_admin.table("quiz_attempts")
                .select("attempt_number")
                .eq("quiz_id", quiz_id)
                .eq("student_id", student_id)
                .execute()
            )

            if len(existing_attempts.data or []) >= quiz["max_attempts"]:
                raise ValueError("Maximum attempts reached")

        # Get next attempt number
        attempt_number = len(existing_attempts.data or []) + 1 if quiz.get("max_attempts") else 1

        # Create attempt
        attempt_data = {
            "quiz_id": quiz_id,
            "student_id": student_id,
            "attempt_number": attempt_number,
            "status": "in_progress",
            "started_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("quiz_attempts").insert(attempt_data).execute()

        if not result.data:
            raise ValueError("Failed to create quiz attempt")

        return result.data[0]

    @staticmethod
    def submit_quiz(attempt_id: str, student_id: str, answers: List[Dict[str, Any]]) -> dict:
        """Submit quiz answers and grade"""
        # Get attempt
        attempt_result = (
            supabase_admin.table("quiz_attempts")
            .select("*")
            .eq("id", attempt_id)
            .single()
            .execute()
        )

        if not attempt_result.data:
            raise ValueError("Attempt not found")

        attempt = attempt_result.data

        # Verify ownership
        if attempt["student_id"] != student_id:
            raise PermissionError("Not authorized")

        if attempt["status"] != "in_progress":
            raise ValueError("Attempt already submitted")

        # Get quiz and questions
        quiz = QuizService.get_quiz(attempt["quiz_id"])
        if not quiz:
            raise ValueError("Quiz not found")

        questions_result = (
            supabase_admin.table("questions")
            .select("*")
            .eq("quiz_id", attempt["quiz_id"])
            .execute()
        )

        questions = {q["id"]: q for q in (questions_result.data or [])}

        # Grade each answer
        total_points = sum(q["points"] for q in questions.values())
        earned_points = 0.0
        feedback = []

        for answer_data in answers:
            question_id = answer_data["question_id"]
            student_answer = answer_data["answer"]

            if question_id not in questions:
                continue

            question = questions[question_id]
            correct_answer = question["correct_answer"]

            # Grade answer
            is_correct = QuizService._check_answer(
                student_answer, correct_answer, question["question_type"]
            )

            awarded_points = question["points"] if is_correct else 0.0
            earned_points += awarded_points

            # Save answer
            answer_record = {
                "attempt_id": attempt_id,
                "question_id": question_id,
                "answer": student_answer,
                "awarded_points": awarded_points,
                "is_correct": is_correct,
            }

            supabase_admin.table("quiz_answers").insert(answer_record).execute()

            # Build feedback
            feedback.append({
                "question_id": question_id,
                "question_text": question["question_text"],
                "is_correct": is_correct,
                "awarded_points": awarded_points,
                "explanation": question.get("explanation"),
                "correct_answer": correct_answer if not is_correct else None,
            })

        # Calculate score and pass status
        score = (earned_points / total_points * 100) if total_points > 0 else 0
        passed = score >= quiz["pass_mark"]

        # Update attempt
        update_data = {
            "score": round(score, 2),
            "passed": passed,
            "status": "graded",
            "submitted_at": datetime.utcnow().isoformat(),
        }

        supabase_admin.table("quiz_attempts").update(update_data).eq("id", attempt_id).execute()

        return {
            "attempt_id": attempt_id,
            "quiz_id": attempt["quiz_id"],
            "score": round(score, 2),
            "passed": passed,
            "total_points": total_points,
            "earned_points": earned_points,
            "status": "graded",
            "submitted_at": update_data["submitted_at"],
            "feedback": feedback,
        }

    @staticmethod
    def _check_answer(student_answer: Any, correct_answer: Any, question_type: str) -> bool:
        """Check if student answer is correct"""
        if question_type == "true_false":
            return str(student_answer.get("value", "")).lower() == str(
                correct_answer.get("value", "")
            ).lower()

        elif question_type == "multiple_choice":
            # Assume correct_answer has "option" key (e.g., {"option": "A"})
            return student_answer.get("option") == correct_answer.get("option")

        return False

    @staticmethod
    def get_student_attempts(quiz_id: str, student_id: str) -> List[dict]:
        """Get all attempts for a student on a quiz"""
        result = (
            supabase_admin.table("quiz_attempts")
            .select("*")
            .eq("quiz_id", quiz_id)
            .eq("student_id", student_id)
            .order("attempt_number", desc=True)
            .execute()
        )

        return result.data or []

    @staticmethod
    def get_attempt_with_answers(attempt_id: str) -> Optional[dict]:
        """Get attempt with answers"""
        attempt_result = (
            supabase_admin.table("quiz_attempts")
            .select("*")
            .eq("id", attempt_id)
            .single()
            .execute()
        )

        if not attempt_result.data:
            return None

        attempt = attempt_result.data

        # Get answers
        answers_result = (
            supabase_admin.table("quiz_answers")
            .select("*")
            .eq("attempt_id", attempt_id)
            .execute()
        )

        attempt["answers"] = answers_result.data or []

        return attempt

    # ADMIN OPERATIONS
    @staticmethod
    def create_quiz(data: Dict[str, Any]) -> dict:
        """Create quiz (admin)"""
        quiz_data = {
            **data,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = supabase_admin.table("quizzes").insert(quiz_data).execute()

        if not result.data:
            raise ValueError("Failed to create quiz")

        return result.data[0]

    @staticmethod
    def update_quiz(quiz_id: str, data: Dict[str, Any]) -> dict:
        """Update quiz (admin)"""
        result = (
            supabase_admin.table("quizzes")
            .update(data)
            .eq("id", quiz_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update quiz")

        return result.data[0]

    @staticmethod
    def delete_quiz(quiz_id: str) -> bool:
        """Delete quiz (admin)"""
        result = supabase_admin.table("quizzes").delete().eq("id", quiz_id).execute()

        return len(result.data) > 0 if result.data else False

    @staticmethod
    def create_question(data: Dict[str, Any]) -> dict:
        """Create question (admin)"""
        result = supabase_admin.table("questions").insert(data).execute()

        if not result.data:
            raise ValueError("Failed to create question")

        return result.data[0]

    @staticmethod
    def update_question(question_id: str, data: Dict[str, Any]) -> dict:
        """Update question (admin)"""
        result = (
            supabase_admin.table("questions")
            .update(data)
            .eq("id", question_id)
            .execute()
        )

        if not result.data:
            raise ValueError("Failed to update question")

        return result.data[0]

    @staticmethod
    def delete_question(question_id: str) -> bool:
        """Delete question (admin)"""
        result = supabase_admin.table("questions").delete().eq("id", question_id).execute()

        return len(result.data) > 0 if result.data else False
