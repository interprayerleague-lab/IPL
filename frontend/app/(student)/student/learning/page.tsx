'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import ProgressBar from '@/components/student/ProgressBar';

interface Programme {
  id: string;
  title: string;
  description: string;
  total_modules: number;
  completed_modules: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  slug: string;
  description: string;
  sequence_number: number;
  total_lessons: number;
  completed_lessons: number;
  learning_objectives: string[];
}

export default function LearningPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProgramme();
  }, []);

  const loadProgramme = async () => {
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

      // Get programme with progress
      const programmeRes = await fetch(
        `${apiUrl}/api/v1/programmes/${enrollment.programme_id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!programmeRes.ok) {
        setError('Failed to load programme');
        return;
      }

      const programmeData = await programmeRes.json();
      setProgramme(programmeData);
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

  if (!programme) {
    return null;
  }

  return (
    <>
      <h1>{programme.title}</h1>
      <p>{programme.description}</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Overall Progress</h3>
        <ProgressBar
          percentage={
            programme.total_modules > 0
              ? Math.round(
                  (programme.completed_modules / programme.total_modules) * 100
                )
              : 0
          }
        />
        <p style={{ marginTop: '8px' }}>
          {programme.completed_modules} of {programme.total_modules} modules
          completed
        </p>
      </div>

      <h2>Modules</h2>
      <div className="grid">
        {programme.modules.map((module, index) => {
          const isCompleted = module.completed_lessons === module.total_lessons && module.total_lessons > 0;
          const isLocked = index > 0 && programme.modules[index - 1].completed_lessons < programme.modules[index - 1].total_lessons;

          return (
            <div key={module.id} className="card">
              <h3>
                Module {module.sequence_number}: {module.title}
              </h3>
              <p>{module.description}</p>

              <div style={{ marginTop: '12px' }}>
                <ProgressBar
                  percentage={
                    module.total_lessons > 0
                      ? Math.round(
                          (module.completed_lessons / module.total_lessons) * 100
                        )
                      : 0
                  }
                  height="8px"
                />
                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                  {module.completed_lessons} / {module.total_lessons} lessons
                </p>
              </div>

              {isCompleted ? (
                <span className="tag ok" style={{ marginTop: '8px', display: 'inline-block' }}>
                  ✓ Completed
                </span>
              ) : isLocked ? (
                <span className="tag warn" style={{ marginTop: '8px', display: 'inline-block' }}>
                  🔒 Locked
                </span>
              ) : (
                <Link
                  href={`/student/learning/${module.slug}`}
                  className="btn"
                  style={{ marginTop: '8px', display: 'inline-block' }}
                >
                  {module.completed_lessons > 0 ? 'Continue' : 'Start module'}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
