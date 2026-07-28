'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookOpen, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { LibraryItem } from '@/types';

type LibraryTab = 'all' | 'notes' | 'saved';

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchLibrary = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('library')
        .select('*, note:notes(*, author:profiles(*))')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      setItems(data || []);
      setLoading(false);
    };

    fetchLibrary();
  }, [user, supabase]);

  const filteredItems = items.filter(() => {
    // TODO: implement filtering by tab
    return true;
  });

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Mi biblioteca" />

      {/* Tabs */}
      <div className="px-4 pt-3">
        <div className="flex bg-white rounded-xl p-1 border border-border">
          {(['all', 'notes', 'saved'] as LibraryTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-udd-blue text-white'
                  : 'text-udd-gray hover:text-udd-graphite'
              }`}
            >
              {tab === 'all' ? 'Todos' : tab === 'notes' ? 'Apuntes' : 'Guardados'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="flex gap-3">
                <div className="w-14 h-18 bg-udd-blue/5 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-udd-blue/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-udd-graphite line-clamp-1">
                    {item.note?.title || 'Apunte'}
                  </h3>
                  <p className="text-xs text-udd-gray mt-0.5">
                    {item.note?.course} · {item.note?.author?.full_name}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-udd-gray">
                      Comprado {formatDate(item.purchased_at)}
                    </span>
                    {item.progress > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-udd-gray/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-udd-blue rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-udd-gray">{item.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="p-2 self-center rounded-lg hover:bg-udd-gray/5 transition-colors">
                  <FileText size={18} className="text-udd-blue" />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen size={32} className="text-udd-gray" />}
            title="Tu biblioteca está vacía"
            description="Compra apuntes para que aparezcan aquí"
            action={
              <Link href="/explore">
                <button className="px-4 py-2 bg-udd-blue text-white rounded-xl text-sm font-semibold">
                  Explorar apuntes
                </button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
