'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/shared/RatingStars';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Search, BookOpen, Users, X, Filter } from 'lucide-react';
import { formatCLP, getInitials } from '@/lib/utils';
import {
  MATERIAL_TYPE_LABELS,
  MAJOR_OPTIONS,
  type Note,
  type Tutor,
  type MaterialType,
} from '@/types';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'tutors' ? 'tutors' : 'notes';
  const [activeTab, setActiveTab] = useState<'notes' | 'tutors'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    major: '',
    materialType: '',
    minRating: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      if (activeTab === 'notes') {
        let query = supabase
          .from('notes')
          .select('*, author:profiles(*)')
          .eq('status', 'active');

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,course.ilike.%${searchQuery}%`);
        }
        if (filters.major) {
          query = query.eq('major', filters.major);
        }
        if (filters.materialType) {
          query = query.eq('material_type', filters.materialType);
        }

        const { data } = await query.order('created_at', { ascending: false });
        if (!cancelled) {
          setNotes(data || []);
          setLoading(false);
        }
      } else {
        let query = supabase
          .from('tutors')
          .select('*, user:profiles(*), courses:tutor_courses(*)')
          .eq('verified', true);

        if (searchQuery) {
          query = query.or(`user.full_name.ilike.%${searchQuery}%,courses.course_name.ilike.%${searchQuery}%`);
        }
        if (filters.major) {
          query = query.contains('courses.major', [filters.major]);
        }

        const { data } = await query;
        if (!cancelled) {
          setTutors(data || []);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [activeTab, searchQuery, filters, supabase]);

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Explorar" showBack={false} />

      {/* Tabs */}
      <div className="px-4 pt-3">
        <div className="flex bg-white rounded-xl p-1 border border-border">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-udd-blue text-white'
                : 'text-udd-gray hover:text-udd-graphite'
            }`}
          >
            <BookOpen size={16} className="inline mr-2" />
            Apuntes
          </button>
          <button
            onClick={() => setActiveTab('tutors')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'tutors'
                ? 'bg-udd-blue text-white'
                : 'text-udd-gray hover:text-udd-graphite'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Clases
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-udd-gray" />
            <input
              type="text"
              placeholder={activeTab === 'notes' ? 'Buscar apuntes...' : 'Buscar tutores...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-udd-blue/20 focus:border-udd-blue"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-udd-gray hover:text-udd-graphite"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-xl border transition-all ${
              showFilters
                ? 'bg-udd-blue text-white border-udd-blue'
                : 'bg-white text-udd-gray border-border hover:border-udd-gray/40'
            }`}
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="space-y-3 fade-in">
            {activeTab === 'notes' && (
              <>
                <div>
                  <label className="text-xs font-medium text-udd-gray mb-1.5 block">Carrera</label>
                  <select
                    value={filters.major}
                    onChange={(e) => setFilters({ ...filters, major: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm"
                  >
                    <option value="">Todas</option>
                    {MAJOR_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-udd-gray mb-1.5 block">Tipo de material</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            materialType: filters.materialType === value ? '' : value,
                          })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          filters.materialType === value
                            ? 'bg-udd-blue text-white'
                            : 'bg-white border border-border text-udd-graphite'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : activeTab === 'notes' ? (
          notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <Link key={note.id} href={`/explore/notes/${note.id}`}>
                  <Card className="flex gap-3 hover:shadow-md transition-shadow mb-3">
                    <div className="w-16 h-20 bg-udd-blue/5 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen size={20} className="text-udd-blue/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-udd-graphite line-clamp-1">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-udd-gray">{note.course}</span>
                        <span className="text-xs text-udd-gray">·</span>
                        <span className="text-xs text-udd-gray">{note.author?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="primary" size="sm">
                          {MATERIAL_TYPE_LABELS[note.material_type as MaterialType]}
                        </Badge>
                        {note.price === 0 && (
                          <Badge variant="success" size="sm">Gratis</Badge>
                        )}
                      </div>
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
          ) : (
            <EmptyState
              icon={<BookOpen size={32} className="text-udd-gray" />}
              title="No se encontraron apuntes"
              description="Intenta con otros filtros o busca un ramo diferente"
            />
          )
        ) : tutors.length > 0 ? (
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
                      {tutor.user?.major} · {tutor.courses?.map((c) => c.course_name).join(', ')}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Badge variant="primary" size="sm">
                        {tutor.modalities.join(' · ')}
                      </Badge>
                      <span className="text-xs text-udd-gray">
                        {tutor.total_classes} clases
                      </span>
                    </div>
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
        ) : (
          <EmptyState
            icon={<Users size={32} className="text-udd-gray" />}
            title="No se encontraron tutores"
            description="Intenta con otros filtros o busca un ramo diferente"
          />
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-udd-ivory flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-udd-blue/20 border-t-udd-blue rounded-full animate-spin" />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
