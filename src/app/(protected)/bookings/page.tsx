'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, Clock, MapPin, Video, MessageCircle } from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking } from '@/types';

type BookingTab = 'upcoming' | 'past';

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('*, tutor:tutors(*, user:profiles(*)), schedule:tutor_schedules(*)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      setBookings(data || []);
      setLoading(false);
    };

    fetchBookings();
  }, [user, supabase]);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      b.status !== 'cancelled' &&
      b.status !== 'completed' &&
      (!b.schedule || new Date(b.schedule.date) >= now)
  );
  const past = bookings.filter(
    (b) => b.status === 'cancelled' || b.status === 'completed' || (b.schedule && new Date(b.schedule.date) < now)
  );

  const filtered = activeTab === 'upcoming' ? upcoming : past;

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Mis reservas" showBack />

      {/* Tabs */}
      <div className="px-4 pt-3">
        <div className="flex bg-white rounded-xl p-1 border border-border">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-udd-blue text-white'
                : 'text-udd-gray hover:text-udd-graphite'
            }`}
          >
            Próximas ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-udd-blue text-white'
                : 'text-udd-gray hover:text-udd-graphite'
            }`}
          >
            Anteriores ({past.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((booking) => (
              <Card key={booking.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-udd-deep/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-udd-deep">
                        {getInitials(booking.tutor?.user?.full_name || 'TU')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-udd-graphite">
                        {booking.tutor?.user?.full_name || 'Tutor'}
                      </h3>
                      <p className="text-xs text-udd-gray">{booking.course}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      booking.status === 'confirmed'
                        ? 'success'
                        : booking.status === 'completed'
                        ? 'primary'
                        : booking.status === 'cancelled'
                        ? 'default'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {statusLabels[booking.status]}
                  </Badge>
                </div>

                {booking.schedule && (
                  <div className="flex items-center gap-4 text-xs text-udd-gray mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(booking.schedule.date), "d 'de' MMM", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {booking.schedule.start_time.slice(0, 5)} - {booking.schedule.end_time.slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1">
                      {booking.modality === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                      {booking.modality}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm font-bold text-udd-blue">
                    {booking.payment_amount ? formatCLP(booking.payment_amount) : '-'}
                  </span>
                  <Link href={`/messages/${booking.tutor?.user_id}`}>
                    <Button variant="ghost" size="sm">
                      <MessageCircle size={14} className="mr-1" />
                      Chat
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar size={32} className="text-udd-gray" />}
            title={activeTab === 'upcoming' ? 'No tienes reservas próximas' : 'No hay reservas anteriores'}
            description="Explora tutores y reserva una clase"
            action={
              <Link href="/explore?tab=tutors">
                <Button size="sm">Explorar tutores</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
