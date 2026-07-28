'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { CAMPUS_OPTIONS, MAJOR_OPTIONS, SEMESTER_OPTIONS } from '@/types';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

const INTERESTS = [
  'Cálculo II',
  'Álgebra Lineal',
  'Programación Avanzada',
  'Microeconomía',
  'Anatomía I',
  'Derecho Civil',
  'Estadística',
  'Física I',
  'Química General',
  'Derecho Público',
  'Contabilidad',
  'Finanzas',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [campus, setCampus] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return campus && major;
      case 2:
        return semester;
      case 3:
        return interests.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        campus,
        major,
        semester: parseInt(semester),
        interests,
        onboarding_completed: true,
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <div className="min-h-screen bg-udd-ivory flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="h-1 bg-udd-gray/10">
          <div
            className="h-full bg-udd-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3 max-w-[430px] mx-auto">
          <span className="text-sm text-udd-gray">
            Paso {step} de {totalSteps}
          </span>
          <span className="text-sm font-medium text-udd-graphite">
            {step === 1 ? 'Tu carrera' : step === 2 ? 'Tu semestre' : 'Tus intereses'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-[430px] mx-auto w-full">
        {step === 1 && (
          <div className="space-y-6 fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-udd-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} className="text-udd-blue" />
              </div>
              <h2 className="text-xl font-bold text-udd-graphite mb-2">
                Cuéntanos sobre ti
              </h2>
              <p className="text-sm text-udd-gray">
                Selecciona tu campus y carrera para personalizar tu experiencia
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-udd-graphite mb-2">
                  Campus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAMPUS_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCampus(c)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        campus === c
                          ? 'border-udd-blue bg-udd-blue/5 text-udd-blue'
                          : 'border-border bg-white text-udd-graphite hover:border-udd-gray/40'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-udd-graphite mb-2">
                  Carrera
                </label>
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-udd-graphite focus:outline-none focus:ring-2 focus:ring-udd-blue/20 focus:border-udd-blue"
                >
                  <option value="">Selecciona tu carrera</option>
                  {MAJOR_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-udd-sky/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-udd-sky" />
              </div>
              <h2 className="text-xl font-bold text-udd-graphite mb-2">
                ¿En qué semestre estás?
              </h2>
              <p className="text-sm text-udd-gray">
                Esto nos ayuda a mostrarte material relevante para tu nivel
              </p>
            </div>

            <div className="space-y-2">
              {SEMESTER_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSemester(s.split(' ')[0])}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all ${
                    semester === s.split(' ')[0]
                      ? 'border-udd-blue bg-udd-blue/5 text-udd-blue'
                      : 'border-border bg-white text-udd-graphite hover:border-udd-gray/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-udd-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-udd-gold" />
              </div>
              <h2 className="text-xl font-bold text-udd-graphite mb-2">
                ¿Qué ramos te interesan?
              </h2>
              <p className="text-sm text-udd-gray">
                Selecciona los ramos para los que quieres material o tutores
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    interests.includes(interest)
                      ? 'bg-udd-blue text-white'
                      : 'bg-white border border-border text-udd-graphite hover:border-udd-blue/40'
                  }`}
                >
                  {interests.includes(interest) && (
                    <Check size={14} className="inline mr-1" />
                  )}
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-error text-center mt-4">{error}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 safe-bottom">
        <div className="flex gap-3 max-w-[430px] mx-auto">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ChevronLeft size={16} className="mr-1" />
              Atrás            </Button>
          )}
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Siguiente
              <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed()}
              loading={loading}
              className="flex-1"
            >
              Personalizar mi inicio
              <Check size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
