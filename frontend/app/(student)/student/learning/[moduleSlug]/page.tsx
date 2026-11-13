'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Lesson {
  id: string;
  title: string;
  sequence_number: number;
  duration_minutes: number;
  progress_status: string;
  progress_percentage: number;
}

interface Module {
  id: string;
  programme_id: string;
  title: string;
  slug: string;
  description: string;
  learning_objectives: string[];
  lessons: Lesson[];
  total_lessons: number;
  completed_lessons: number;
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<Module | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadModule();
  }, [params.moduleSlug]);

  const loadModule = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Get active enrollment
      const enrollmentRes = await fetch(
        `${apiUrl}/api/v1/enrollments/me/active`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!enrollmentRes.ok) {
        setError('No active enrollment found');
        return;
      }

      const enrollment = await enrollmentRes.json();

      // Get module with lessons
      const moduleRes = await fetch(
        `${apiUrl}/api/v1/programmes/${enrollment.programme_id}/modules/${params.moduleSlug}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!moduleRes.ok) {
        setError('Module not found');
        return;
      }

      const moduleData = await moduleRes.json();
      setModule(moduleData);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="wrap"><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="wrap">
        <div className="card" style={{ borderColor: '#fca5a5' }}>
          <p style={{ color: '#991b1b' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return null;
  }

  return (
    <>
      <Link href="/student/learning" style={{ color: 'var(--primary)', marginBottom: '16px', display: 'inline-block' }}>
        ← Back to all modules
      </Link>

      <h1>{module.title}</h1>
      <p>{module.description}</p>

      {module.learning_objectives && module.learning_objectives.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <h3>Learning Objectives</h3>
          <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
            {module.learning_objectives.map((objective, i) => (
              <li key={i}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 style={{ marginTop: '24px' }}>Lessons</h2>
      <div className="card">
        {module.lessons.map((lesson, index) => {
          const isCompleted = lesson.progress_status === 'completed';
          const isCurrent =
            !isCompleted &&
            (index === 0 || module.lessons[index - 1].progress_status === 'completed');

          return (
            <div
              key={lesson.id}
              className={`les ${isCurrent ? 'cur' : ''} ${isCompleted ? 'done' : ''}`}
              onClick={() => router.push(`/student/lesson/${lesson.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <span>{lesson.title}</span>
              {lesson.duration_minutes && (
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--muted)' }}>
                  {lesson.duration_minutes} min
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', fontSize: '14px' }}>
        <p>
          Progress: {module.completed_lessons} of {module.total_lessons} lessons completed
        </p>
      </div>
    </>
  );
}
