'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { CheckCircle, Plus, X } from 'lucide-react';
import { CAMPUS_OPTIONS, MAJOR_OPTIONS } from '@/types';

export default function PublishTutorPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    hourly_price: 10000,
    campus: 'Santiago',
    modalities: [] as string[],
    courses: [{ course_name: '', major: '' }],
  });

  const toggleModality = (modality: string) => {
    setFormData({
      ...formData,
      modalities: formData.modalities.includes(modality)
        ? formData.modalities.filter((m) => m !== modality)
        : [...formData.modalities, modality],
    });
  };

  const addCourse = () => {
    setFormData({
      ...formData,
      courses: [...formData.courses, { course_name: '', major: '' }],
    });
  };

  const removeCourse = (index: number) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter((_, i) => i !== index),
    });
  };

  const updateCourse = (index: number, field: string, value: string) => {
    const newCourses = [...formData.courses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setFormData({ ...formData, courses: newCourses });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    // Create tutor profile
    const { data: tutor, error: tutorError } = await supabase
      .from('tutors')
      .insert({
        user_id: user.id,
        bio: formData.bio,
        experience: formData.experience || null,
        hourly_price: formData.hourly_price,
        campus: formData.campus,
        modalities: formData.modalities,
        verified: false,
      })
      .select()
      .single();

    if (tutorError || !tutor) {
      setToast({ message: 'Error al crear perfil de tutor', type: 'error' });
      setLoading(false);
      return;
    }

    // Add courses
    const coursesToInsert = formData.courses
      .filter((c) => c.course_name && c.major)
      .map((c) => ({
        tutor_id: tutor.id,
        course_name: c.course_name,
        major: c.major,
      }));

    if (coursesToInsert.length > 0) {
      await supabase.from('tutor_courses').insert(coursesToInsert);
    }

    setToast({ message: '¡Perfil de tutor creado!', type: 'success' });
    setTimeout(() => router.push('/profile/creator'), 2000);
    setLoading(false);
  };

  const canSubmit =
    formData.bio &&
    formData.modalities.length > 0 &&
    formData.courses.some((c) => c.course_name && c.major);

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Ofrecer clases" showBack />

      <div className="px-4 py-6 space-y-4 max-w-[430px] mx-auto">
        <div>
          <label className="block text-sm font-medium text-udd-graphite mb-1.5">Bio</label>
          <textarea
            placeholder="Cuéntanos sobre ti, tu experiencia y metodología..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-udd-blue/20 focus:border-udd-blue resize-none"
          />
        </div>

        <Input
          label="Experiencia"
          placeholder="Ej: 2 años dando clases particulares"
          value={formData.experience}
          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-udd-graphite mb-2">Modalidades</label>
          <div className="flex gap-2">
            {['presencial', 'online'].map((mod) => (
              <button
                key={mod}
                onClick={() => toggleModality(mod)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all capitalize ${
                  formData.modalities.includes(mod)
                    ? 'border-udd-blue bg-udd-blue/5 text-udd-blue'
                    : 'border-border bg-white text-udd-graphite'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-udd-graphite mb-2">Campus</label>
          <select
            value={formData.campus}
            onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm"
          >
            {CAMPUS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Input
          label="Precio por hora (CLP)"
          type="number"
          value={formData.hourly_price}
          onChange={(e) => setFormData({ ...formData, hourly_price: parseInt(e.target.value) || 0 })}
        />

        {/* Courses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-udd-graphite">Ramos que enseñas</label>
            <button
              onClick={addCourse}
              className="text-sm text-udd-blue font-medium flex items-center gap-1"
            >
              <Plus size={14} />
              Agregar
            </button>
          </div>
          <div className="space-y-3">
            {formData.courses.map((course, index) => (
              <Card key={index} padding="sm">
                <div className="flex gap-2">
                  <input
                    placeholder="Nombre del ramo"
                    value={course.course_name}
                    onChange={(e) => updateCourse(index, 'course_name', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-udd-blue/20"
                  />
                  {formData.courses.length > 1 && (
                    <button
                      onClick={() => removeCourse(index)}
                      className="p-2 text-udd-gray hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <select
                  value={course.major}
                  onChange={(e) => updateCourse(index, 'major', e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-white text-sm"
                >
                  <option value="">Carrera</option>
                  {MAJOR_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-bottom">
        <div className="max-w-[430px] mx-auto">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            fullWidth
            size="lg"
          >
            <CheckCircle size={16} className="mr-2" />
            Crear perfil de tutor
          </Button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
