'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface Module {
  id?: string;
  programme_id?: string;
  title: string;
  slug: string;
  description: string;
  learning_objectives: string[];
  sequence_number: number;
  is_published: boolean;
}

interface Props {
  programmeId: string | null;
  module: Module | null;
  onClose: () => void;
}

export default function ModuleForm({ programmeId, module, onClose }: Props) {
  const [formData, setFormData] = useState<Module>({
    title: '',
    slug: '',
    description: '',
    learning_objectives: [],
    sequence_number: 1,
    is_published: false,
  });
  const [objectiveInput, setObjectiveInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (module) {
      setFormData(module);
    }
  }, [module]);

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

      const payload = module
        ? formData
        : { ...formData, programme_id: programmeId };

      const url = module
        ? `${apiUrl}/api/v1/admin/content/modules/${module.id}`
        : `${apiUrl}/api/v1/admin/content/modules`;

      const method = module ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(module ? 'Module updated successfully' : 'Module created successfully');
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to save module'}`);
      }
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Error saving module');
    } finally {
      setLoading(false);
    }
  };

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData({
        ...formData,
        learning_objectives: [...formData.learning_objectives, objectiveInput.trim()],
      });
      setObjectiveInput('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      learning_objectives: formData.learning_objectives.filter((_, i) => i !== index),
    });
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
      slug: module ? formData.slug : generateSlug(title),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{module ? 'Edit Module' : 'New Module'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Module Title *
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="e.g., Foundations of Faith"
            />
          </label>

          <label>
            Slug *
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="e.g., foundations-of-faith"
            />
          </label>

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
            Description
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this module"
            />
          </label>

          <label>
            Learning Objectives
            <div className="objectives-input">
              <input
                type="text"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                placeholder="Add an objective"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addObjective();
                  }
                }}
              />
              <button type="button" className="btn-add-obj" onClick={addObjective}>
                + Add
              </button>
            </div>
          </label>

          {formData.learning_objectives.length > 0 && (
            <ul className="objectives-list">
              {formData.learning_objectives.map((obj, index) => (
                <li key={index}>
                  <span>{obj}</span>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeObjective(index)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            />
            <span>Publish module (make visible to students)</span>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : module ? 'Update Module' : 'Create Module'}
            </button>
          </div>
        </form>
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
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--line);
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

        .objectives-input {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .objectives-input input {
          flex: 1;
        }

        .btn-add-obj {
          padding: 11px 16px;
          background: var(--bg);
          border: 1.5px solid var(--line);
          border-radius: 10px;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-add-obj:hover {
          background: var(--primary);
          color: white;
        }

        .objectives-list {
          list-style: none;
          padding: 0;
          margin: 12px 0 0 0;
          background: var(--bg);
          border-radius: 10px;
          padding: 8px;
        }

        .objectives-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: var(--card);
          border-radius: 8px;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .objectives-list li:last-child {
          margin-bottom: 0;
        }

        .btn-remove {
          background: none;
          border: none;
          color: var(--error);
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
          border-radius: 4px;
        }

        .btn-remove:hover {
          background: #fef2f2;
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

          .objectives-input {
            flex-direction: column;
          }

          .btn-add-obj {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
