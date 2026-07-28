'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { RatingStars } from '@/components/shared/RatingStars';
import {
  TrendingUp,
  DollarSign,
  BookOpen,
  Users,
  Star,
  Plus,
} from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import type { Note, Tutor } from '@/types';

export default function CreatorProfilePage() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tutorProfile, setTutorProfile] = useState<Tutor | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalBookings: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // First, get the tutor profile if it exists
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('*, user:profiles(*), courses:tutor_courses(*)')
        .eq('user_id', user.id)
        .single();

      setTutorProfile(tutorData);

      // Then fetch other data in parallel
      const [notesResult, salesResult, bookingsResult] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('library')
          .select('id, note:notes(price)', { count: 'exact' })
          .in('note_id', []),
        tutorData
          ? supabase
              .from('bookings')
              .select('id', { count: 'exact' })
              .eq('tutor_id', tutorData.id)
          : { count: 0, data: [] },
      ]);

      setNotes(notesResult.data || []);

      // Calculate stats
      const totalSales = salesResult.count || 0;
      const totalRevenue = (salesResult.data || []).reduce(
        (sum: number, item: Record<string, unknown>) => {
          const note = item.note as Record<string, unknown> | null;
          return sum + ((note?.price as number) || 0);
        },
        0
      );
      const totalBookings = bookingsResult.count || 0;

      setStats({
        totalSales,
        totalRevenue,
        totalBookings,
        averageRating: tutorData?.average_rating || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [user, supabase, notes]);

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    review: 'En revisión',
    paused: 'Pausado',
    rejected: 'Rechazado',
    draft: 'Borrador',
  };

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header
        title="Panel del creador"
        showBack
        rightAction={
          <Link href="/publish">
            <Button size="sm">
              <Plus size={14} className="mr-1" />
              Nuevo
            </Button>
          </Link>
        }
      />

      {/* Profile Summary */}
      <div className="px-4 py-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-udd-deep/10 flex items-center justify-center">
              <span className="text-lg font-bold text-udd-deep">
                {getInitials(user?.full_name || 'CR')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-udd-graphite">
                  {user?.full_name || 'Creador'}
                </h1>
                {user?.verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-sm text-udd-gray">{user?.major}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-udd-blue" />
              <span className="text-xs text-udd-gray">Ingresos</span>
            </div>
            <p className="text-xl font-bold text-udd-graphite">{formatCLP(stats.totalRevenue)}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-udd-sky" />
              <span className="text-xs text-udd-gray">Ventas</span>
            </div>
            <p className="text-xl font-bold text-udd-graphite">{stats.totalSales}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-udd-gold" />
              <span className="text-xs text-udd-gray">Reservas</span>
            </div>
            <p className="text-xl font-bold text-udd-graphite">{stats.totalBookings}</p>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-udd-gold" />
              <span className="text-xs text-udd-gray">Calificación</span>
            </div>
            <p className="text-xl font-bold text-udd-graphite">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            </p>
          </Card>
        </div>
      </div>

      {/* Notes */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-udd-graphite flex items-center gap-2">
            <BookOpen size={16} className="text-udd-blue" />
            Mis apuntes ({notes.length})
          </h2>
          <Link href="/publish/note" className="text-sm text-udd-blue font-medium">
            + Nuevo
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-udd-blue/5 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-udd-blue/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-udd-graphite line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="text-xs text-udd-gray">{note.course}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={note.status === 'active' ? 'success' : note.status === 'review' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {statusLabels[note.status]}
                    </Badge>
                    <p className="text-xs text-udd-gray mt-1">{note.downloads} ventas</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <BookOpen size={24} className="text-udd-gray mx-auto mb-2" />
            <p className="text-sm text-udd-gray">Aún no has publicado apuntes</p>
            <Link href="/publish/note">
              <Button size="sm" className="mt-3">
                Publicar primer apunte
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Tutor Profile */}
      {tutorProfile && (
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-udd-graphite flex items-center gap-2">
              <Users size={16} className="text-udd-sky" />
              Perfil de tutor
            </h2>
          </div>
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-udd-sky/10 flex items-center justify-center">
                <Users size={16} className="text-udd-sky" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-udd-graphite">
                  {tutorProfile.courses?.length || 0} ramos · {tutorProfile.total_classes} clases
                </p>
                <p className="text-xs text-udd-gray">
                  {formatCLP(tutorProfile.hourly_price)}/hora
                </p>
              </div>
              <RatingStars rating={tutorProfile.average_rating || 0} size="sm" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
