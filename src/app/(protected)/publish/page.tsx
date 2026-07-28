'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { BookOpen, Users } from 'lucide-react';

export default function PublishPage() {
  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Publicar" />

      <div className="px-4 py-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-udd-graphite mb-2">
            ¿Qué quieres compartir?
          </h2>
          <p className="text-sm text-udd-gray">
            Elige qué tipo de contenido quieres publicar
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/publish/note">
            <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-udd-blue/10 flex items-center justify-center shrink-0">
                <BookOpen size={28} className="text-udd-blue" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-udd-graphite">
                  Publicar apunte
                </h3>
                <p className="text-sm text-udd-gray">
                  Comparte tus apuntes, resúmenes o guías de estudio
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/publish/tutor">
            <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-udd-sky/10 flex items-center justify-center shrink-0">
                <Users size={28} className="text-udd-sky" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-udd-graphite">
                  Ofrecer clases
                </h3>
                <p className="text-sm text-udd-gray">
                  Da clases particulares y ayuda a otros estudiantes
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
