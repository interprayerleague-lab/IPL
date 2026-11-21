'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Quiz {
  id: string;
  title: string;
  pass_mark: number;
  max_attempts: number | null;
  is_published: boolean;
  question_count: number;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  sequence_number: number;
  is_published: boolean;
  quizzes: Quiz[];
}

interface Module {
  id: string;
  title: string;
  slug: string;
  sequence_number: number;
  is_published: boolean;
  lesson_count: number;
  lessons: Lesson[];
}

interface Programme {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  module_count: number;
  modules: Module[];
}

interface Props {
  programme: Programme;
  onAddModule: (programmeId: string) => void;
  onEditModule: (module: Module) => void;
  onAddLesson: (programmeId: string, moduleId: string) => void;
  onEditLesson: (programmeId: string, lesson: Lesson) => void;
  onRefresh: () => void;
}

export default function ContentHierarchy({
  programme,
  onAddModule,
  onEditModule,
  onAddLesson,
  onEditLesson,
  onRefresh,
}: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (!confirm(`Delete module "${moduleName}"? This will also delete all lessons and quizzes.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/admin/content/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('Module deleted successfully');
        onRefresh();
      } else {
        alert('Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Error deleting module');
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessonName: string) => {
    if (!confirm(`Delete lesson "${lessonName}"? This will also delete associated quizzes.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/admin/content/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('Lesson deleted successfully');
        onRefresh();
      } else {
        alert('Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Error deleting lesson');
    }
  };

  return (
    <div className="content-hierarchy">
      <div className="programme-header">
        <h3>{programme.title}</h3>
        <span className={`tag ${programme.is_published ? 'ok' : 'warn'}`}>
          {programme.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="content-table-wrapper">
        <table className="content-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Lessons</th>
              <th>Quiz</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {programme.modules.map((module) => (
              <>
                <tr key={module.id} className="module-row">
                  <td>
                    <button
                      className="expand-btn"
                      onClick={() => toggleModule(module.id)}
                      aria-label={expandedModules.has(module.id) ? 'Collapse' : 'Expand'}
                    >
                      {expandedModules.has(module.id) ? '▼' : '▶'}
                    </button>
                    <strong>
                      {module.sequence_number}. {module.title}
                    </strong>
                  </td>
                  <td>{module.lesson_count}</td>
                  <td>
                    {module.lessons.reduce((sum, lesson) => sum + lesson.quizzes.length, 0)} quizzes
                  </td>
                  <td>
                    <span className={`tag ${module.is_published ? 'ok' : 'warn'}`}>
                      {module.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => onEditModule(module)}
                        aria-label="Edit module"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteModule(module.id, module.title)}
                        aria-label="Delete module"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedModules.has(module.id) &&
                  module.lessons.map((lesson) => (
                    <tr key={lesson.id} className="lesson-row">
                      <td className="lesson-indent">{lesson.title}</td>
                      <td>Lesson {lesson.sequence_number}</td>
                      <td>
                        {lesson.quizzes.length > 0
                          ? `${lesson.quizzes[0].question_count} questions`
                          : 'No quiz'}
                      </td>
                      <td>
                        <span className={`tag ${lesson.is_published ? 'ok' : 'warn'}`}>
                          {lesson.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => onEditLesson(programme.id, lesson)}
                            aria-label="Edit lesson"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            aria-label="Delete lesson"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {expandedModules.has(module.id) && (
                  <tr className="add-lesson-row">
                    <td colSpan={5}>
                      <button
                        className="btn-add-inline"
                        onClick={() => onAddLesson(programme.id, module.id)}
                      >
                        + Add lesson
                      </button>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="content-actions">
        <button className="btn" onClick={() => onAddModule(programme.id)}>
          Add module
        </button>
        <button className="btn ghost" onClick={() => onAddLesson(programme.id, programme.modules[0]?.id || '')}>
          Add lesson
        </button>
      </div>

      <style jsx>{`
        .content-hierarchy {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .programme-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }

        .programme-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .content-table-wrapper {
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .content-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .content-table th {
          text-align: left;
          padding: 10px 12px;
          background: var(--bg);
          border-bottom: 2px solid var(--line);
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
        }

        .content-table td {
          padding: 12px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }

        .module-row {
          font-weight: 500;
        }

        .module-row td {
          background: var(--bg);
        }

        .lesson-row td {
          background: var(--card);
        }

        .lesson-indent {
          padding-left: 48px !important;
          color: var(--muted);
        }

        .add-lesson-row td {
          background: var(--card);
          padding: 8px 12px;
        }

        .expand-btn {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          padding: 0;
          margin-right: 8px;
          font-size: 12px;
          width: 20px;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-edit,
        .btn-delete {
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-edit:hover {
          background: var(--bg);
        }

        .btn-delete {
          color: var(--error);
        }

        .btn-delete:hover {
          background: #fef2f2;
        }

        .btn-add-inline {
          background: none;
          border: 1.5px dashed var(--line);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
        }

        .btn-add-inline:hover {
          background: var(--bg);
          border-color: var(--primary);
        }

        .content-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .content-hierarchy {
            padding: 14px;
          }

          .programme-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .content-table {
            font-size: 13px;
          }

          .content-table th,
          .content-table td {
            padding: 8px 6px;
          }

          .lesson-indent {
            padding-left: 32px !important;
          }

          .action-buttons {
            flex-direction: column;
            gap: 4px;
          }

          .btn-edit,
          .btn-delete {
            font-size: 12px;
            padding: 5px 10px;
          }

          .content-actions {
            flex-direction: column;
          }

          .content-actions .btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .content-table th:nth-child(2),
          .content-table td:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
