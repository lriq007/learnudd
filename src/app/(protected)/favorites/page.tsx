'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Heart, BookOpen } from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import type { Favorite } from '@/types';

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('*, note:notes(*, author:profiles(*)), tutor:tutors(*, user:profiles(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setFavorites(data || []);
      setLoading(false);
    };

    fetchFavorites();
  }, [user, supabase]);

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Favoritos" />

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div key={fav.id}>
                {fav.note && (
                  <Link href={`/explore/notes/${fav.note_id}`}>
                    <Card className="flex gap-3 hover:shadow-md transition-shadow mb-3">
                      <div className="w-14 h-18 bg-udd-blue/5 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen size={20} className="text-udd-blue/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-udd-graphite line-clamp-1">
                          {fav.note.title}
                        </h3>
                        <p className="text-xs text-udd-gray mt-0.5">
                          {fav.note.course} · {fav.note.author?.full_name}
                        </p>
                        <div className="mt-2">
                          {fav.note.price > 0 ? (
                            <span className="text-sm font-bold text-udd-blue">
                              {formatCLP(fav.note.price)}
                            </span>
                          ) : (
                            <Badge variant="success" size="sm">Gratis</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
                {fav.tutor && (
                  <Link href={`/explore/tutors/${fav.tutor_id}`}>
                    <Card className="flex gap-3 hover:shadow-md transition-shadow mb-3">
                      <div className="w-12 h-12 rounded-full bg-udd-deep/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-udd-deep">
                          {getInitials(fav.tutor.user?.full_name || 'TU')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-udd-graphite">
                          {fav.tutor.user?.full_name || 'Tutor'}
                        </h3>
                        <p className="text-xs text-udd-gray mt-0.5">
                          {fav.tutor.user?.major}
                        </p>
                      </div>
                    </Card>
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={32} className="text-udd-gray" />}
            title="No tienes favoritos"
            description="Guarda apuntes y tutores que te interesen"
            action={
              <Link href="/explore">
                <button className="px-4 py-2 bg-udd-blue text-white rounded-xl text-sm font-semibold">
                  Explorar
                </button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
