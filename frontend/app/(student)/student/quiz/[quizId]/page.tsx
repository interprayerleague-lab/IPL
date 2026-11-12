'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  points: number;
  sequence_number: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  pass_mark: number;
  max_attempts: number;
  questions: Question[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuizAndStart();
  }, [params.quizId]);

  const loadQuizAndStart = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Get quiz
      const quizRes = await fetch(`${apiUrl}/api/v1/quizzes/${params.quizId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!quizRes.ok) {
        alert('Quiz not found or not available');
        router.back();
        return;
      }

      const quizData = await quizRes.json();
      setQuiz(quizData);

      // Start attempt
      const attemptRes = await fetch(`${apiUrl}/api/v1/quizzes/${params.quizId}/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!attemptRes.ok) {
        const error = await attemptRes.json();
        alert(error.detail || 'Failed to start quiz');
        router.back();
        return;
      }

      const attemptData = await attemptRes.json();
      setAttemptId(attemptData.id);
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Error loading quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    // Validate all questions answered
    const unanswered = quiz?.questions.filter((q) => !answers[q.id]);
    if (unanswered && unanswered.length > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Format answers
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer,
      }));

      const response = await fetch(
        `${apiUrl}/api/v1/quizzes/${params.quizId}/attempts/${attemptId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            answers: formattedAnswers,
          }),
        }
      );

      if (!response.ok) {
        alert('Failed to submit quiz');
        return;
      }

      const result = await response.json();

      // Redirect to results page
      router.push(`/student/quiz/${params.quizId}/results/${attemptId}`);
    } catch (error) {
      alert('Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div><p>Loading quiz...</p></div>;
  }

  if (!quiz) {
    return null;
  }

  return (
    <>
      <h2>{quiz.title}</h2>
      <p>
        <span className="tag">Pass mark: {quiz.pass_mark}%</span>
        {quiz.max_attempts && <> <span className="tag">Max attempts: {quiz.max_attempts}</span></>}
      </p>
      {quiz.description && <p>{quiz.description}</p>}

      <div className="card">
        {quiz.questions.map((question, index) => (
          <div key={question.id} style={{ marginBottom: '24px' }}>
            <h3>
              {index + 1}. {question.question_text}
            </h3>

            {question.question_type === 'multiple_choice' && question.options && (
              <>
                {Object.entries(question.options).map(([key, value]: [string, any]) => (
                  <label key={key} className="opt">
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      onChange={() => handleAnswerChange(question.id, { option: key })}
                      checked={answers[question.id]?.option === key}
                    />
                    {value}
                  </label>
                ))}
              </>
            )}

            {question.question_type === 'true_false' && (
              <>
                <label className="opt">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    onChange={() => handleAnswerChange(question.id, { value: 'true' })}
                    checked={answers[question.id]?.value === 'true'}
                  />
                  True
                </label>
                <label className="opt">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    onChange={() => handleAnswerChange(question.id, { value: 'false' })}
                    checked={answers[question.id]?.value === 'false'}
                  />
                  False
                </label>
              </>
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          className="btn blk"
          style={{ marginTop: '14px' }}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit quiz'}
        </button>
      </div>
    </>
  );
}
