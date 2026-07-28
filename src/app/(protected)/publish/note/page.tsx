'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { CheckCircle, Brain } from 'lucide-react';
import { MATERIAL_TYPE_OPTIONS, MAJOR_OPTIONS, SEMESTER_OPTIONS } from '@/types';
import type { AIDeclaration } from '@/types';

export default function PublishNotePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    major: '',
    course: '',
    semester: '',
    material_type: '',
    price: 0,
    pages: 0,
    ai_declaration: 'none' as AIDeclaration,
    ai_details: '',
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title && formData.course;
      case 2:
        return formData.major && formData.material_type;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from('notes').insert({
      author_id: user.id,
      title: formData.title,
      description: formData.description || null,
      major: formData.major,
      course: formData.course,
      semester: formData.semester || null,
      material_type: formData.material_type,
      price: formData.price,
      pages: formData.pages || null,
      ai_declaration: formData.ai_declaration,
      ai_details: formData.ai_details || null,
      status: 'review',
    });

    if (error) {
      setToast({ message: 'Error al publicar', type: 'error' });
    } else {
      setToast({ message: '¡Apunte enviado a revisión!', type: 'success' });
      setTimeout(() => router.push('/profile/creator'), 2000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-udd-ivory flex flex-col">
      {/* Progress */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="h-1 bg-udd-gray/10">
          <div
            className="h-full bg-udd-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-udd-gray">Paso {step} de {totalSteps}</span>
          <span className="text-sm font-medium text-udd-graphite">
            {step === 1 ? 'Datos básicos' : step === 2 ? 'Categoría' : step === 3 ? 'Precio' : 'Revisión'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 max-w-[430px] mx-auto w-full">
        {step === 1 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-lg font-bold text-udd-graphite">Datos del apunte</h2>
            <Input
              label="Título"
              placeholder="Ej: Resumen completo Certamen 1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-udd-graphite mb-1.5">Descripción</label>
              <textarea
                placeholder="Describe el contenido de tu apunte..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-udd-blue/20 focus:border-udd-blue resize-none"
              />
            </div>
            <Input
              label="Ramo"
              placeholder="Ej: Cálculo II"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            />
            <Input
              label="Número de páginas"
              type="number"
              placeholder="Ej: 25"
              value={formData.pages || ''}
              onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-lg font-bold text-udd-graphite">Categoría</h2>
            <div>
              <label className="block text-sm font-medium text-udd-graphite mb-2">Carrera</label>
              <select
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm"
              >
                <option value="">Selecciona</option>
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-udd-graphite mb-2">Semestre</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm"
              >
                <option value="">Opcional</option>
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-udd-graphite mb-2">Tipo de material</label>
              <div className="grid grid-cols-2 gap-2">
                {MATERIAL_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, material_type: opt.value })}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      formData.material_type === opt.value
                        ? 'border-udd-blue bg-udd-blue/5 text-udd-blue'
                        : 'border-border bg-white text-udd-graphite hover:border-udd-gray/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-lg font-bold text-udd-graphite">Precio</h2>
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-udd-graphite mb-2">
                    Precio en CLP
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-2xl font-bold text-udd-graphite focus:outline-none focus:ring-2 focus:ring-udd-blue/20 focus:border-udd-blue"
                  />
                  <p className="text-xs text-udd-gray mt-2">
                    Deja en 0 para ofrecer gratis
                  </p>
                </div>
                <div className="flex gap-2">
                  {[0, 2490, 3990, 5490].map((price) => (
                    <button
                      key={price}
                      onClick={() => setFormData({ ...formData, price })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.price === price
                          ? 'bg-udd-blue text-white'
                          : 'bg-udd-gray/10 text-udd-gray hover:bg-udd-gray/20'
                      }`}
                    >
                      {price === 0 ? 'Gratis' : `$${price.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 fade-in">
            <h2 className="text-lg font-bold text-udd-graphite">Declaración de IA</h2>
            <Card>
              <div className="flex items-start gap-3">
                <Brain size={20} className="text-udd-sky mt-0.5" />
                <div>
                  <p className="text-sm text-udd-gray leading-relaxed">
                    Declara si utilizaste inteligencia artificial para crear este material.
                    Esto es transparente con tus compradores.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              {[
                { value: 'none', label: 'Sin IA', desc: 'Creé este material sin usar IA' },
                { value: 'assisted', label: 'Asistido por IA', desc: 'Usé IA como herramienta, revisé todo manualmente' },
                { value: 'generated', label: 'Generado con IA', desc: 'La IA generó el contenido, lo revisé antes de publicar' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, ai_declaration: opt.value as AIDeclaration })}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    formData.ai_declaration === opt.value
                      ? 'border-udd-blue bg-udd-blue/5'
                      : 'border-border bg-white hover:border-udd-gray/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.ai_declaration === opt.value
                        ? 'border-udd-blue bg-udd-blue'
                        : 'border-udd-gray/30'
                    }`}>
                      {formData.ai_declaration === opt.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-udd-graphite">{opt.label}</span>
                  </div>
                  <p className="text-xs text-udd-gray mt-1 ml-6">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Summary */}
            <Card>
              <h3 className="text-sm font-semibold text-udd-graphite mb-3">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-udd-gray">Título</span>
                  <span className="text-udd-graphite font-medium">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-udd-gray">Ramo</span>
                  <span className="text-udd-graphite font-medium">{formData.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-udd-gray">Precio</span>
                  <span className="text-udd-graphite font-medium">
                    {formData.price === 0 ? 'Gratis' : `$${formData.price.toLocaleString()}`}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-bottom">
        <div className="flex gap-3 max-w-[430px] mx-auto">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Atrás
            </Button>
          )}
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1">
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              <CheckCircle size={16} className="mr-2" />
              Publicar
            </Button>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
