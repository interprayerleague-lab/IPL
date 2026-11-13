'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: any;
  video_url: string;
  duration_minutes: number;
  progress_status: string;
  progress_percentage: number;
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  description: string;
  file_path: string;
  external_url: string;
  resource_type: string;
  is_downloadable: boolean;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [params.lessonId]);

  const loadLesson = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Get lesson
      const lessonRes = await fetch(
        `${apiUrl}/api/v1/programmes/lessons/${params.lessonId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!lessonRes.ok) {
        setError('Lesson not found');
        return;
      }

      const lessonData = await lessonRes.json();
      setLesson(lessonData);

      // Update progress to in_progress if not started
      if (!lessonData.progress_status || lessonData.progress_status === 'not_started') {
        await fetch(
          `${apiUrl}/api/v1/progress/lessons/${params.lessonId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              status: 'in_progress',
              progress_percentage: 10,
            }),
          }
        );
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    setMarkingComplete(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      await fetch(
        `${apiUrl}/api/v1/progress/lessons/${params.lessonId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status: 'completed',
            progress_percentage: 100,
          }),
        }
      );

      // Redirect back to module page
      router.push('/student/learning');
    } catch (err) {
      alert('Failed to mark lesson as complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    // Convert youtube.com/watch?v=ID to youtube.com/embed/ID
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const renderContent = () => {
    if (!lesson?.content) return null;

    // If content is string, render as HTML
    if (typeof lesson.content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: lesson.content }} />;
    }

    // If content is object with markdown/html field
    if (lesson.content.html) {
      return <div dangerouslySetInnerHTML={{ __html: lesson.content.html }} />;
    }

    if (lesson.content.markdown) {
      // For now, render markdown as plain text
      // TODO: Add markdown parser library if needed
      return <div style={{ whiteSpace: 'pre-wrap' }}>{lesson.content.markdown}</div>;
    }

    // Fallback: render as JSON
    return <pre>{JSON.stringify(lesson.content, null, 2)}</pre>;
  };

  if (loading) {
    return <div className="wrap"><p>Loading lesson...</p></div>;
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

  if (!lesson) {
    return null;
  }

  const isCompleted = lesson.progress_status === 'completed';

  return (
    <>
      <h2>{lesson.title}</h2>
      <p>{lesson.description}</p>

      {lesson.video_url && (
        <div className="player" style={{ marginBottom: '14px' }}>
          <iframe
            src={getYouTubeEmbedUrl(lesson.video_url)}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              borderRadius: '14px',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="card">
        <h3>Lesson notes</h3>
        {renderContent()}

        {lesson.resources && lesson.resources.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3>Resources</h3>
            {lesson.resources.map((resource) => (
              <div key={resource.id} style={{ marginBottom: '8px' }}>
                {resource.external_url ? (
                  <a
                    href={resource.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn ghost"
                    style={{ marginRight: '8px' }}
                  >
                    📎 {resource.title}
                  </a>
                ) : resource.file_path ? (
                  <a
                    href={resource.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn ghost"
                    style={{ marginRight: '8px' }}
                  >
                    📎 {resource.title}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {isCompleted ? (
          <div style={{ marginTop: '14px' }}>
            <span className="tag ok">✓ Completed</span>
          </div>
        ) : (
          <button
            className="btn blk"
            style={{ marginTop: '14px' }}
            onClick={markAsComplete}
            disabled={markingComplete}
          >
            {markingComplete ? 'Saving...' : 'Mark as complete and continue'}
          </button>
        )}
      </div>
    </>
  );
}
