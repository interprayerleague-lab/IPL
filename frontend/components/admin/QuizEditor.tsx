'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: any;
  correct_answer: any;
  explanation: string;
  points: number;
  sequence_number: number;
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  pass_mark: number;
  max_attempts: number | null;
  is_published: boolean;
}

interface Props {
  lessonId: string;
  onClose: () => void;
}

export default function QuizEditor({ lessonId, onClose }: Props) {
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    pass_mark: 70,
    max_attempts: null,
    is_published: false,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  const loadQuiz = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Check if quiz exists for this lesson
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (quizData) {
        setQuiz(quizData);
        setQuizId(quizData.id);

        // Load questions
        const response = await fetch(`${apiUrl}/api/v1/admin/quizzes/${quizData.id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const fullQuiz = await response.json();
          setQuestions(fullQuiz.questions || []);
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const payload = quizId ? quiz : { ...quiz, lesson_id: lessonId };
      const url = quizId
        ? `${apiUrl}/api/v1/admin/quizzes/${quizId}`
        : `${apiUrl}/api/v1/admin/quizzes`;
      const method = quizId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedQuiz = await response.json();
        if (!quizId) {
          setQuizId(savedQuiz.id);
        }
        alert('Quiz saved successfully');
      } else {
        alert('Failed to save quiz');
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: { A: '', B: '', C: '', D: '' },
      correct_answer: {},
      explanation: '',
      points: 1,
      sequence_number: questions.length + 1,
    });
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async (question: Question) => {
    if (!quizId) {
      alert('Please save the quiz first');
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const payload = question.id ? question : { ...question, quiz_id: quizId };
      const url = question.id
        ? `${apiUrl}/api/v1/admin/questions/${question.id}`
        : `${apiUrl}/api/v1/admin/questions`;
      const method = question.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Question saved');
        setShowQuestionForm(false);
        setEditingQuestion(null);
        loadQuiz();
      } else {
        alert('Failed to save question');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error saving question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('Question deleted');
        loadQuiz();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (loading) {
    return <div>Loading quiz...</div>;
  }

  return (
    <div className="quiz-editor">
      <h4>Quiz Configuration</h4>

      <div className="quiz-form">
        <label>
          Quiz Title *
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            placeholder="e.g., Repentance Quiz"
          />
        </label>

        <label>
          Description
          <textarea
            value={quiz.description}
            onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
            rows={2}
            placeholder="Instructions for students"
          />
        </label>

        <div className="row">
          <label>
            Pass Mark (%) *
            <input
              type="number"
              min="0"
              max="100"
              value={quiz.pass_mark}
              onChange={(e) => setQuiz({ ...quiz, pass_mark: parseFloat(e.target.value) })}
            />
          </label>

          <label>
            Max Attempts
            <input
              type="number"
              min="1"
              value={quiz.max_attempts || ''}
              onChange={(e) =>
                setQuiz({
                  ...quiz,
                  max_attempts: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
            />
          </label>
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={quiz.is_published}
            onChange={(e) => setQuiz({ ...quiz, is_published: e.target.checked })}
          />
          <span>Publish quiz</span>
        </label>

        <button className="btn" onClick={handleSaveQuiz} disabled={saving}>
          {saving ? 'Saving...' : quizId ? 'Update Quiz' : 'Create Quiz'}
        </button>
      </div>

      {quizId && (
        <div className="questions-section">
          <h4>Questions ({questions.length})</h4>

          {questions.length > 0 && (
            <div className="questions-list">
              {questions.map((q, index) => (
                <div key={q.id || index} className="question-item">
                  <div className="question-header">
                    <strong>
                      Q{q.sequence_number}: {q.question_text}
                    </strong>
                    <div className="question-actions">
                      <button className="btn-edit-sm" onClick={() => handleEditQuestion(q)}>
                        Edit
                      </button>
                      <button className="btn-delete-sm" onClick={() => handleDeleteQuestion(q.id!)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <small>
                    Type: {q.question_type} | Points: {q.points}
                  </small>
                </div>
              ))}
            </div>
          )}

          <button className="btn ghost" onClick={handleAddQuestion}>
            + Add Question
          </button>
        </div>
      )}

      {showQuestionForm && editingQuestion && (
        <QuestionForm
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
        />
      )}

      <style jsx>{`
        .quiz-editor {
          background: var(--card);
          border-radius: 12px;
          padding: 20px;
        }

        .quiz-editor h4 {
          margin: 0 0 16px;
          font-size: 18px;
        }

        .quiz-form {
          background: var(--bg);
          padding: 16px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .questions-section {
          margin-top: 24px;
        }

        .questions-list {
          margin: 16px 0;
        }

        .question-item {
          background: var(--bg);
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 6px;
        }

        .question-actions {
          display: flex;
          gap: 6px;
        }

        .btn-edit-sm,
        .btn-delete-sm {
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--card);
          cursor: pointer;
        }

        .btn-edit-sm {
          color: var(--primary);
        }

        .btn-delete-sm {
          color: var(--error);
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
        }

        @media (max-width: 768px) {
          .quiz-editor {
            padding: 14px;
          }

          .question-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

interface QuestionFormProps {
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

function QuestionForm({ question, onSave, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState<Question>(question);

  const handleTypeChange = (type: 'multiple_choice' | 'true_false') => {
    if (type === 'true_false') {
      setFormData({
        ...formData,
        question_type: type,
        options: { true: 'True', false: 'False' },
        correct_answer: { answer: 'true' },
      });
    } else {
      setFormData({
        ...formData,
        question_type: type,
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: { answer: 'A' },
      });
    }
  };

  const handleOptionChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      options: { ...formData.options, [key]: value },
    });
  };

  return (
    <div className="question-form-modal">
      <div className="question-form-content">
        <h4>{question.id ? 'Edit Question' : 'New Question'}</h4>

        <label>
          Question Text *
          <textarea
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            rows={3}
            required
          />
        </label>

        <label>
          Question Type *
          <select
            value={formData.question_type}
            onChange={(e) => handleTypeChange(e.target.value as any)}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
          </select>
        </label>

        {formData.question_type === 'multiple_choice' && (
          <div className="options-grid">
            {Object.keys(formData.options).map((key) => (
              <label key={key}>
                Option {key} *
                <input
                  type="text"
                  value={formData.options[key]}
                  onChange={(e) => handleOptionChange(key, e.target.value)}
                  required
                />
              </label>
            ))}
          </div>
        )}

        <label>
          Correct Answer *
          {formData.question_type === 'multiple_choice' ? (
            <select
              value={formData.correct_answer.answer || 'A'}
              onChange={(e) =>
                setFormData({ ...formData, correct_answer: { answer: e.target.value } })
              }
            >
              {Object.keys(formData.options).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={formData.correct_answer.answer || 'true'}
              onChange={(e) =>
                setFormData({ ...formData, correct_answer: { answer: e.target.value } })
              }
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          )}
        </label>

        <label>
          Explanation
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={2}
            placeholder="Why this answer is correct (shown after submission)"
          />
        </label>

        <div className="row">
          <label>
            Points *
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
              required
            />
          </label>

          <label>
            Sequence *
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
        </div>

        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={() => onSave(formData)}>
            Save Question
          </button>
        </div>
      </div>

      <style jsx>{`
        .question-form-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .question-form-content {
          background: var(--card);
          border-radius: 14px;
          padding: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .question-form-content h4 {
          margin: 0 0 16px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .form-actions .btn {
          flex: 1;
        }

        @media (max-width: 768px) {
          .options-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
