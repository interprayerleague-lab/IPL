'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Result {
  score: number;
  passed: boolean;
  total_points: number;
  earned_points: number;
  feedback: any[];
}

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    loadResults();
  }, [params.attemptId]);

  const loadResults = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/v1/quizzes/attempts/${params.attemptId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Build result from attempt data
        const feedbackData = data.answers || [];
        setResult({
          score: data.score || 0,
          passed: data.passed || false,
          total_points: 0,
          earned_points: 0,
          feedback: feedbackData,
        });
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div><p>Loading results...</p></div>;
  }

  if (!result) {
    return <div><p>Results not found</p></div>;
  }

  return (
    <>
      <div className="card" style={{ textAlign: 'center' }}>
        <span className={result.passed ? 'tag ok' : 'tag warn'}>
          {result.passed ? 'Passed' : 'Failed'}
        </span>
        <h1 style={{ marginTop: '8px' }}>{Math.round(result.score)}%</h1>
        <p>
          {result.passed
            ? 'Congratulations! You passed the quiz.'
            : 'You did not pass. Review the feedback below and try again.'}
        </p>
      </div>

      {result.feedback && result.feedback.length > 0 && (
        <>
          <h3 style={{ marginTop: '24px' }}>Question Feedback</h3>
          {result.feedback.map((item: any, index: number) => (
            <div
              key={item.question_id || index}
              className="card"
              style={{
                marginBottom: '12px',
                borderColor: item.is_correct ? '#dcfce7' : '#fca5a5',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b>
                  Question {index + 1} - {item.is_correct ? '✓ Correct' : '✗ Incorrect'}
                </b>
                <span style={{ fontSize: '14px' }}>
                  {item.awarded_points} / {item.points || 1} points
                </span>
              </div>
              <p>{item.question_text}</p>
              {!item.is_correct && item.explanation && (
                <p style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                  {item.explanation}
                </p>
              )}
            </div>
          ))}
        </>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        {!result.passed && (
          <Link href={`/student/quiz/${params.quizId}`} className="btn ghost">
            Retake quiz
          </Link>
        )}
        <Link href="/student/learning" className="btn">
          {result.passed ? 'Continue learning' : 'Back to lessons'}
        </Link>
      </div>
    </>
  );
}
