'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ContentHierarchy from '@/components/admin/ContentHierarchy';
import ModuleForm from '@/components/admin/ModuleForm';
import LessonForm from '@/components/admin/LessonForm';

interface ContentData {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  module_count: number;
  modules: Module[];
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

interface Lesson {
  id: string;
  title: string;
  slug: string;
  sequence_number: number;
  is_published: boolean;
  quizzes: Quiz[];
}

interface Quiz {
  id: string;
  title: string;
  pass_mark: number;
  max_attempts: number | null;
  is_published: boolean;
  question_count: number;
}

export default function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<ContentData[]>([]);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/admin/content/overview`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgrammes(data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = (programmeId: string) => {
    setSelectedProgramme(programmeId);
    setEditingItem(null);
    setShowModuleForm(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingItem(module);
    setSelectedProgramme(null);
    setShowModuleForm(true);
  };

  const handleAddLesson = (programmeId: string, moduleId: string) => {
    setSelectedProgramme(programmeId);
    setSelectedModule(moduleId);
    setEditingItem(null);
    setShowLessonForm(true);
  };

  const handleEditLesson = (programmeId: string, lesson: Lesson) => {
    setSelectedProgramme(programmeId);
    setSelectedModule(null);
    setEditingItem(lesson);
    setShowLessonForm(true);
  };

  const handleFormClose = () => {
    setShowModuleForm(false);
    setShowLessonForm(false);
    setEditingItem(null);
    setSelectedProgramme(null);
    setSelectedModule(null);
    loadContent();
  };

  if (loading) {
    return (
      <div className="main">
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="content-header">
        <h2>Content</h2>
      </div>

      {programmes.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)' }}>No programmes found</p>
        </div>
      ) : (
        programmes.map((programme) => (
          <ContentHierarchy
            key={programme.id}
            programme={programme}
            onAddModule={handleAddModule}
            onEditModule={handleEditModule}
            onAddLesson={handleAddLesson}
            onEditLesson={handleEditLesson}
            onRefresh={loadContent}
          />
        ))
      )}

      {showModuleForm && (
        <ModuleForm
          programmeId={selectedProgramme}
          module={editingItem}
          onClose={handleFormClose}
        />
      )}

      {showLessonForm && (
        <LessonForm
          programmeId={selectedProgramme}
          moduleId={selectedModule}
          lesson={editingItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
