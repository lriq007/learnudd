'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/shared/RatingStars';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Toast } from '@/components/ui/Toast';
import {
  MapPin,
  Clock,
  Video,
  Building,
  Calendar,
  MessageCircle,
  Star,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Tutor, TutorSchedule, TutorRating } from '@/types';

export default function TutorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [schedules, setSchedules] = useState<TutorSchedule[]>([]);
  const [ratings, setRatings] = useState<TutorRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchTutor = async () => {
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('*, user:profiles(*), courses:tutor_courses(*)')
        .eq('id', params.id)
        .single();

      if (tutorData) {
        setTutor(tutorData);

        const [schedulesResult, ratingsResult] = await Promise.all([
          supabase
            .from('tutor_schedules')
            .select('*')
            .eq('tutor_id', params.id)
            .eq('available', true)
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(10),
          supabase
            .from('tutor_ratings')
            .select('*, user:profiles(*)')
            .eq('tutor_id', params.id)
            .order('created_at', { ascending: false }),
        ]);

        setSchedules(schedulesResult.data || []);
        setRatings(ratingsResult.data || []);
      }
      setLoading(false);
    };

    fetchTutor();
  }, [params.id, supabase]);

  const handleBooking = async () => {
    if (!tutor || !user || !selectedSchedule) return;

    setBooking(true);

    const schedule = schedules.find((s) => s.id === selectedSchedule);
    if (!schedule) return;

    const { error } = await supabase.from('bookings').insert({
      student_id: user.id,
      tutor_id: tutor.id,
      schedule_id: selectedSchedule,
      course: tutor.courses?.[0]?.course_name || 'General',
      modality: tutor.modalities.includes('online') ? 'online' : 'presencial',
      status: 'pending',
      payment_status: 'pending',
      payment_amount: tutor.hourly_price,
    });

    if (error) {
      setToast({ message: 'Error al crear la reserva', type: 'error' });
    } else {
      // Mark schedule as unavailable
      await supabase
        .from('tutor_schedules')
        .update({ available: false })
        .eq('id', selectedSchedule);

      setToast({ message: '¡Reserva creada! Revisa tus mensajes.', type: 'success' });
      setSelectedSchedule(null);
    }

    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-udd-ivory">
        <Header title="Tutor" showBack />
        <div className="px-4 py-6 space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-8 w-3/4 rounded-lg" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-udd-ivory">
        <Header title="No encontrado" showBack />
        <div className="flex items-center justify-center h-64">
          <p className="text-udd-gray">Tutor no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Perfil del tutor" showBack />

      {/* Profile Header */}
      <div className="px-4 py-6">
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-udd-deep/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-udd-deep">
                {getInitials(tutor.user?.full_name || 'TU')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-udd-graphite">
                  {tutor.user?.full_name || 'Tutor'}
                </h1>
                {tutor.verified && <VerifiedBadge size="md" />}
              </div>
              <p className="text-sm text-udd-gray mt-0.5">
                {tutor.user?.major} · {tutor.user?.semester}° Semestre
              </p>
              <div className="flex items-center gap-4 mt-2">
                <RatingStars
                  rating={tutor.average_rating || 0}
                  size="md"
                  showValue
                  showCount
                  count={tutor.ratings_count || 0}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-udd-blue">{tutor.total_classes}</p>
              <p className="text-xs text-udd-gray">Clases</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-udd-blue">
                {formatCLP(tutor.hourly_price)}
              </p>
              <p className="text-xs text-udd-gray">Por hora</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-udd-blue">
                {tutor.modalities.length}
              </p>
              <p className="text-xs text-udd-gray">Modalidades</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bio & Details */}
      <div className="px-4 space-y-4">
        {tutor.bio && (
          <Card>
            <h3 className="text-sm font-semibold text-udd-graphite mb-2">Acerca de</h3>
            <p className="text-sm text-udd-gray leading-relaxed">{tutor.bio}</p>
          </Card>
        )}

        {/* Modalities & Campus */}
        <Card>
          <h3 className="text-sm font-semibold text-udd-graphite mb-3">Modalidades</h3>
          <div className="flex flex-wrap gap-2">
            {tutor.modalities.includes('presencial') && (
              <Badge variant="primary" size="md">
                <Building size={14} className="mr-1.5" />
                Presencial
              </Badge>
            )}
            {tutor.modalities.includes('online') && (
              <Badge variant="primary" size="md">
                <Video size={14} className="mr-1.5" />
                En línea
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-udd-gray">
            <MapPin size={14} />
            Campus {tutor.campus}
          </div>
        </Card>

        {/* Courses */}
        {tutor.courses && tutor.courses.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-udd-graphite mb-3">Ramos que enseña</h3>
            <div className="flex flex-wrap gap-2">
              {tutor.courses.map((course) => (
                <Badge key={course.id} variant="default" size="md">
                  <GraduationCap size={12} className="mr-1" />
                  {course.course_name}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Available Schedules */}
        <Card>
          <h3 className="text-sm font-semibold text-udd-graphite mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-udd-blue" />
            Horarios disponibles
          </h3>
          {schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() =>
                    setSelectedSchedule(
                      selectedSchedule === schedule.id ? null : schedule.id
                    )
                  }
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedSchedule === schedule.id
                      ? 'border-udd-blue bg-udd-blue/5'
                      : 'border-border bg-white hover:border-udd-gray/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-udd-graphite">
                        {format(new Date(schedule.date), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-xs text-udd-gray flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </p>
                    </div>
                    {selectedSchedule === schedule.id && (
                      <CheckCircle size={20} className="text-udd-blue" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-udd-gray text-center py-4">
              No hay horarios disponibles por el momento
            </p>
          )}
        </Card>

        {/* Reviews */}
        <div>
          <h3 className="text-sm font-semibold text-udd-graphite mb-3 flex items-center gap-2">
            <Star size={16} className="text-udd-gold" />
            Opiniones ({ratings.length})
          </h3>
          {ratings.length > 0 ? (
            <div className="space-y-3">
              {ratings.slice(0, 5).map((rating) => (
                <Card key={rating.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-udd-gray/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-udd-gray">
                        {getInitials(rating.user?.full_name || 'U')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-udd-graphite">
                          {rating.user?.full_name || 'Usuario'}
                        </span>
                        {rating.verified_class && (
                          <Badge variant="primary" size="sm">
                            <CheckCircle size={10} className="mr-1" />
                            Clase realizada
                          </Badge>
                        )}
                      </div>
                      <RatingStars rating={rating.rating} size="sm" showValue={false} />
                      {rating.comment && (
                        <p className="text-sm text-udd-gray mt-1">{rating.comment}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-udd-gray text-center py-4">
              Aún no hay opiniones para este tutor
            </p>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push('/messages')}
            className="px-4"
          >
            <MessageCircle size={18} />
          </Button>
          <Button
            onClick={handleBooking}
            loading={booking}
            disabled={!selectedSchedule}
            className="flex-1"
            size="lg"
          >
            <Calendar size={18} className="mr-2" />
            Reservar horario
          </Button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
