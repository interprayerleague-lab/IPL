'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import QuizEditor from './QuizEditor';

interface Lesson {
  id?: string;
  module_id?: string;
  title: string;
  slug: string;
  description: string;
  content: any;
  video_url: string;
  duration_minutes: number | null;
  sequence_number: number;
  is_required: boolean;
  is_published: boolean;
}

interface Props {
  programmeId: string | null;
  moduleId: string | null;
  lesson: Lesson | null;
  onClose: () => void;
}

export default function LessonForm({ programmeId, moduleId, lesson, onClose }: Props) {
  const [formData, setFormData] = useState<Lesson>({
    title: '',
    slug: '',
    description: '',
    content: { notes: '' },
    video_url: '',
    duration_minutes: null,
    sequence_number: 1,
    is_required: true,
    is_published: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  useEffect(() => {
    if (lesson) {
      setFormData(lesson);
      if (lesson.module_id) {
        setSelectedModuleId(lesson.module_id);
      }
    } else if (moduleId) {
      setSelectedModuleId(moduleId);
    }
  }, [lesson, moduleId]);

  useEffect(() => {
    if (programmeId) {
      loadModules();
    }
  }, [programmeId]);

  const loadModules = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data, error } = await supabase
        .from('modules')
        .select('id, title, sequence_number')
        .eq('programme_id', programmeId)
        .order('sequence_number');

      if (data) {
        setModules(data);
        if (!selectedModuleId && data.length > 0) {
          setSelectedModuleId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `lesson-resources/${fileName}`;

      const { data, error } = await supabase.storage
        .from('lesson-resources')
        .upload(filePath, file);

      if (error) {
        alert(`Upload failed: ${error.message}`);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('lesson-resources').getPublicUrl(filePath);

      alert('File uploaded successfully. You can attach it as a resource after creating the lesson.');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const payload = lesson
        ? formData
        : { ...formData, module_id: selectedModuleId };

      const url = lesson
        ? `${apiUrl}/api/v1/admin/content/lessons/${lesson.id}`
        : `${apiUrl}/api/v1/admin/content/lessons`;

      const method = lesson ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(lesson ? 'Lesson updated successfully' : 'Lesson created successfully');
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to save lesson'}`);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Error saving lesson');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: lesson ? formData.slug : generateSlug(title),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{lesson ? 'Edit Lesson' : 'New Lesson'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!lesson && modules.length > 0 && (
            <label>
              Module *
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                required
              >
                <option value="">Select a module</option>
                {modules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.sequence_number}. {mod.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Lesson Title *
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="e.g., Repentance"
            />
          </label>

          <label>
            Slug *
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="e.g., repentance"
            />
          </label>

          <div className="row">
            <label>
              Sequence Number *
              <input
                type="number"
                min="1"
                value={formData.sequence_number}
                onChange={(e) =>
                  setFormData({ ...formData, sequence_number: parseInt(e.target.value) })
                }
                required
              />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                min="0"
                value={formData.duration_minutes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Optional"
              />
            </label>
          </div>

          <label>
            Video URL
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="Vimeo, YouTube, or other video link"
            />
          </label>

          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Brief lesson summary"
            />
          </label>

          <label>
            Notes (Markdown)
            <textarea
              value={formData.content?.notes || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  content: { ...formData.content, notes: e.target.value },
                })
              }
              rows={8}
              placeholder="Lesson content in markdown format...

Example:
## Key Scriptures
1 Corinthians 12:4-11; Romans 12:6-8

## Summary
The Spirit distributes gifts as He wills..."
            />
          </label>

          <label>
            Attach Resource
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
            />
            {uploading && <small>Uploading...</small>}
          </label>

          <div className="form-checks">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
              />
              <span>Required lesson (must be completed to progress)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              />
              <span>Publish lesson (make visible to students)</span>
            </label>
          </div>

          {lesson && (
            <div className="quiz-section">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowQuizEditor(!showQuizEditor)}
              >
                {showQuizEditor ? 'Hide Quiz Editor' : '+ Add/Edit Quiz'}
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>

        {showQuizEditor && lesson && (
          <div className="quiz-editor-wrapper">
            <QuizEditor lessonId={lesson.id!} onClose={() => setShowQuizEditor(false)} />
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }

        .modal-content {
          background: var(--card);
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .modal-large {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          background: var(--card);
          z-index: 10;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .close-btn:hover {
          background: var(--bg);
          color: var(--ink);
        }

        .modal-form {
          padding: 24px;
        }

        .form-checks {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 16px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type='checkbox'] {
          width: auto;
          margin: 0;
          cursor: pointer;
        }

        .quiz-section {
          margin: 20px 0;
          padding: 16px;
          background: var(--bg);
          border-radius: 10px;
        }

        .quiz-editor-wrapper {
          border-top: 1px solid var(--line);
          padding: 24px;
          background: var(--bg);
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--line);
        }

        .modal-actions .btn {
          flex: 1;
        }

        @media (max-width: 768px) {
          .modal-content {
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-overlay {
            padding: 0;
          }

          .row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
