'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ProgressBar from '@/components/student/ProgressBar';
import Link from 'next/link';

interface Enrollment {
  id: string;
  programme_title: string;
  cohort_name: string;
  status: string;
  programme_id: string;
}

interface Programme {
  id: string;
  title: string;
  total_modules: number;
  completed_modules: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  slug: string;
  sequence_number: number;
  total_lessons: number;
  completed_lessons: number;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  published_at: string;
}

export default function StudentDashboard() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      setUser(session.user);

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

      if (enrollmentRes.ok) {
        const enrollmentData = await enrollmentRes.json();
        setEnrollment(enrollmentData);

        // Get programme with progress
        if (enrollmentData.programme_id) {
          const programmeRes = await fetch(
            `${apiUrl}/api/v1/programmes/${enrollmentData.programme_id}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (programmeRes.ok) {
            const programmeData = await programmeRes.json();
            setProgramme(programmeData);
          }
        }
      }

      // Get announcements
      const announcementsRes = await fetch(
        `${apiUrl}/api/v1/announcements?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!programme || programme.total_modules === 0) return 0;
    return Math.round(
      (programme.completed_modules / programme.total_modules) * 100
    );
  };

  const getCurrentModule = () => {
    if (!programme || !programme.modules) return null;
    // Find first incomplete module
    return (
      programme.modules.find(
        (m) => m.completed_lessons < m.total_lessons
      ) || programme.modules[programme.modules.length - 1]
    );
  };

  if (loading) {
    return (
      <div className="wrap">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="wrap">
        <h2>Welcome!</h2>
        <div className="card">
          <h3>No active enrollment</h3>
          <p>
            You are not currently enrolled in a programme. Please complete your
            application to get started.
          </p>
          <Link href="/student/application" className="btn">
            View application
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = getCurrentModule();
  const overallProgress = calculateOverallProgress();

  return (
    <>
      <div className="banner">
        <h2>Welcome back, {user?.user_metadata?.first_name || 'Student'}!</h2>
        <p>
          You are {overallProgress}% through the {programme?.title || 'programme'}.
        </p>
        <ProgressBar percentage={overallProgress} />
      </div>

      <div className="grid">
        {currentModule && (
          <div className="card">
            <span className="tag">Current module</span>
            <h3 style={{ marginTop: '8px' }}>{currentModule.title}</h3>
            <p>
              {currentModule.completed_lessons} of {currentModule.total_lessons}{' '}
              lessons completed
            </p>
            <Link
              href={`/student/learning/${currentModule.slug}`}
              className="btn"
            >
              Continue learning
            </Link>
          </div>
        )}

        <div className="card">
          <h3>Programme Progress</h3>
          {programme?.modules.map((module) => (
            <div key={module.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{module.title}</span>
                <span className={module.completed_lessons === module.total_lessons && module.total_lessons > 0 ? 'tag ok' : 'tag'}>
                  {module.completed_lessons === module.total_lessons && module.total_lessons > 0
                    ? 'Passed'
                    : 'In progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: '18px' }}>Ministry announcements</h3>
      {announcements.length === 0 ? (
        <div className="card">
          <p>No announcements at this time.</p>
        </div>
      ) : (
        announcements.map((announcement) => (
          <div key={announcement.id} className="card" style={{ marginBottom: '10px' }}>
            <b>{announcement.title}</b>
            <p>{announcement.body}</p>
          </div>
        ))
      )}

      {announcements.length > 0 && (
        <Link href="/student/announcements" style={{ display: 'inline-block', marginTop: '10px', color: 'var(--primary)' }}>
          View all announcements →
        </Link>
      )}
    </>
  );
}
