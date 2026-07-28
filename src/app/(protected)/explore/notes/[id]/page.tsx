'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/shared/RatingStars';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { AIDeclarationBadge } from '@/components/shared/AIDeclaration';
import { Toast } from '@/components/ui/Toast';
import {
  BookOpen,
  Heart,
  FileText,
  ShoppingCart,
  CheckCircle,
  Star,
} from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import { MATERIAL_TYPE_LABELS, type Note, type NoteRating, type MaterialType } from '@/types';

export default function NoteDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [note, setNote] = useState<Note | null>(null);
  const [ratings, setRatings] = useState<NoteRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchNote = async () => {
      const { data: noteData } = await supabase
        .from('notes')
        .select('*, author:profiles(*)')
        .eq('id', params.id)
        .single();

      if (noteData) {
        setNote(noteData);

        const { data: ratingsData } = await supabase
          .from('note_ratings')
          .select('*, user:profiles(*)')
          .eq('note_id', params.id)
          .order('created_at', { ascending: false });

        setRatings(ratingsData || []);

        if (user) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('note_id', params.id)
            .single();

          setIsFavorite(!!fav);
        }
      }
      setLoading(false);
    };

    fetchNote();
  }, [params.id, supabase, user]);

  const handlePurchase = async () => {
    if (!note || !user) return;

    setPurchasing(true);

    // Simulate payment
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Add to library
    const { error } = await supabase.from('library').insert({
      user_id: user.id,
      note_id: note.id,
    });

    if (error) {
      setToast({ message: 'Error al procesar el pago', type: 'error' });
    } else {
      // Update downloads
      await supabase
        .from('notes')
        .update({ downloads: (note.downloads || 0) + 1 })
        .eq('id', note.id);

      setToast({ message: '¡El apunte ya es tuyo!', type: 'success' });
    }

    setPurchasing(false);
  };

  const toggleFavorite = async () => {
    if (!user || !note) return;

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('note_id', note.id);
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        note_id: note.id,
      });
    }

    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-udd-ivory">
        <Header title="Detalle" showBack />
        <div className="px-4 py-6 space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-8 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-udd-ivory">
        <Header title="No encontrado" showBack />
        <div className="flex items-center justify-center h-64">
          <p className="text-udd-gray">Apunte no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Detalle del apunte" showBack />

      {/* Cover / Sample Preview */}
      <div className="px-4 py-4">
        <div className="relative w-full h-64 bg-udd-blue/5 rounded-2xl flex items-center justify-center watermark">
          <BookOpen size={48} className="text-udd-blue/30" />
          <div className="absolute bottom-3 left-3 flex gap-2">
            <Badge variant="primary" size="sm">
              {MATERIAL_TYPE_LABELS[note.material_type as MaterialType]}
            </Badge>
            {note.pages && (
              <Badge variant="default" size="sm">
                <FileText size={12} className="mr-1" />
                {note.pages} págs
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-udd-graphite">{note.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 rounded-full bg-udd-deep/10 flex items-center justify-center">
                <span className="text-xs font-bold text-udd-deep">
                  {getInitials(note.author?.full_name || 'AU')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-udd-graphite flex items-center gap-1">
                  {note.author?.full_name || 'Autor'}
                  <VerifiedBadge size="sm" />
                </p>
                <p className="text-xs text-udd-gray">{note.author?.major}</p>
              </div>
            </div>
          </div>
          {note.price > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-udd-blue">{formatCLP(note.price)}</p>
              <p className="text-xs text-udd-gray">CLP</p>
            </div>
          )}
          {note.price === 0 && (
            <Badge variant="success" size="md">Gratis</Badge>
          )}
        </div>

        {/* Rating */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <RatingStars
              rating={note.average_rating || 0}
              size="md"
              showValue
              showCount
              count={note.ratings_count || 0}
            />
            <span className="text-sm text-udd-gray">
              {note.downloads} descargas
            </span>
          </div>
        </Card>

        {/* Description */}
        {note.description && (
          <div>
            <h3 className="text-sm font-semibold text-udd-graphite mb-2">Descripción</h3>
            <p className="text-sm text-udd-gray leading-relaxed">{note.description}</p>
          </div>
        )}

        {/* AI Declaration */}
        <AIDeclarationBadge
          declaration={note.ai_declaration}
          details={note.ai_details}
        />

        {/* Details */}
        <Card padding="sm">
          <h3 className="text-sm font-semibold text-udd-graphite mb-3">Detalles</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-udd-gray">Carrera</p>
              <p className="font-medium text-udd-graphite">{note.major}</p>
            </div>
            <div>
              <p className="text-udd-gray">Ramo</p>
              <p className="font-medium text-udd-graphite">{note.course}</p>
            </div>
            {note.semester && (
              <div>
                <p className="text-udd-gray">Semestre</p>
                <p className="font-medium text-udd-graphite">{note.semester}</p>
              </div>
            )}
            <div>
              <p className="text-udd-gray">Tipo</p>
              <p className="font-medium text-udd-graphite">
                {MATERIAL_TYPE_LABELS[note.material_type as MaterialType]}
              </p>
            </div>
          </div>
        </Card>

        {/* Reviews */}
        <div>
          <h3 className="text-sm font-semibold text-udd-graphite mb-3 flex items-center gap-2">
            <Star size={16} className="text-udd-gold" />
            Opiniones verificadas ({ratings.length})
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
                        {rating.verified_purchase && (
                          <Badge variant="primary" size="sm">
                            <CheckCircle size={10} className="mr-1" />
                            Compra verificada
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
              Aún no hay opiniones para este apunte
            </p>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
          <button
            onClick={toggleFavorite}
            className={`p-3 rounded-xl border transition-all ${
              isFavorite
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'bg-white border-border text-udd-gray hover:text-udd-graphite'
            }`}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <Button
            onClick={handlePurchase}
            loading={purchasing}
            className="flex-1"
            size="lg"
          >
            <ShoppingCart size={18} className="mr-2" />
            {note.price > 0
              ? `Comprar por ${formatCLP(note.price)}`
              : 'Descargar gratis'}
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
