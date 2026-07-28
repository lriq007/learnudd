'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/shared/RatingStars';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Search, BookOpen, Users, Star, TrendingUp, Clock } from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import type { Note, Tutor } from '@/types';

export default function HomePage() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [notesResult, tutorsResult] = await Promise.all([
        supabase
          .from('notes')
          .select('*, author:profiles(*)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('tutors')
          .select('*, user:profiles(*), courses:tutor_courses(*)')
          .eq('verified', true)
          .limit(3),
      ]);

      setNotes(notesResult.data || []);
      setTutors(tutorsResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header />

      {/* Welcome Section */}
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-udd-graphite mb-1">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Estudiante'}
        </h1>
        <p className="text-sm text-udd-gray mb-4">
          ¿Qué necesitas para tus ramos hoy?
        </p>

        {/* Search */}
        <Link href="/explore">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-border shadow-sm">
            <Search size={18} className="text-udd-gray" />
            <span className="text-sm text-udd-gray">Busca un ramo, apunte o tutor</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/explore?tab=notes">
            <Card className="flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-udd-blue/10 flex items-center justify-center">
                <BookOpen size={20} className="text-udd-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-udd-graphite">Apuntes</p>
                <p className="text-xs text-udd-gray">Material verificado</p>
              </div>
            </Card>
          </Link>
          <Link href="/explore?tab=tutors">
            <Card className="flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-udd-sky/10 flex items-center justify-center">
                <Users size={20} className="text-udd-sky" />
              </div>
              <div>
                <p className="text-sm font-semibold text-udd-graphite">Clases</p>
                <p className="text-xs text-udd-gray">Tutores UDD</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* For your courses */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-udd-blue" />
            <h2 className="text-base font-semibold text-udd-graphite">
              Para tus ramos
            </h2>
          </div>
          <Link href="/explore" className="text-sm text-udd-blue font-medium">
            Ver todo
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.slice(0, 3).map((note) => (
              <Link key={note.id} href={`/explore/notes/${note.id}`}>
                <Card className="flex gap-3 hover:shadow-md transition-shadow mb-3">
                  <div className="w-16 h-20 bg-udd-blue/5 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen size={24} className="text-udd-blue/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-udd-graphite line-clamp-1">
                        {note.title}
                      </h3>
                      {note.price === 0 && (
                        <Badge variant="success" size="sm">Gratis</Badge>
                      )}
                    </div>
                    <p className="text-xs text-udd-gray mt-0.5">
                      {note.course} · {note.author?.full_name || 'Autor'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <RatingStars
                        rating={note.average_rating || 0}
                        size="sm"
                        showCount
                        count={note.ratings_count || 0}
                      />
                      {note.price > 0 && (
                        <span className="text-sm font-bold text-udd-blue">
                          {formatCLP(note.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Top rated */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-udd-gold" />
            <h2 className="text-base font-semibold text-udd-graphite">
              Mejor evaluados
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-40 w-40 rounded-2xl shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {notes
              .filter((n) => (n.average_rating || 0) >= 4.5)
              .slice(0, 4)
              .map((note) => (
                <Link
                  key={note.id}
                  href={`/explore/notes/${note.id}`}
                  className="w-40 shrink-0"
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <div className="w-full h-24 bg-udd-blue/5 rounded-xl flex items-center justify-center mb-2">
                      <BookOpen size={24} className="text-udd-blue/40" />
                    </div>
                    <h3 className="text-xs font-semibold text-udd-graphite line-clamp-2 mb-1">
                      {note.title}
                    </h3>
                    <p className="text-xs text-udd-gray mb-2">{note.course}</p>
                    <RatingStars
                      rating={note.average_rating || 0}
                      size="sm"
                      showValue
                    />
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Available tutors */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-udd-sky" />
            <h2 className="text-base font-semibold text-udd-graphite">
              Tutores disponibles esta semana
            </h2>
          </div>
          <Link href="/explore?tab=tutors" className="text-sm text-udd-blue font-medium">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {tutors.map((tutor) => (
              <Link key={tutor.id} href={`/explore/tutors/${tutor.id}`}>
                <Card className="flex gap-3 hover:shadow-md transition-shadow mb-3">
                  <div className="w-12 h-12 rounded-full bg-udd-deep/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-udd-deep">
                      {getInitials(tutor.user?.full_name || 'TU')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-udd-graphite">
                        {tutor.user?.full_name || 'Tutor'}
                      </h3>
                      {tutor.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-xs text-udd-gray mt-0.5">
                      {tutor.user?.major} · {tutor.courses?.[0]?.course_name || 'Varios ramos'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <RatingStars
                        rating={tutor.average_rating || 0}
                        size="sm"
                        showCount
                        count={tutor.ratings_count || 0}
                      />
                      <span className="text-sm font-bold text-udd-blue">
                        {formatCLP(tutor.hourly_price)}/h
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
