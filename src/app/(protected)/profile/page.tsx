'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import {
  BookOpen,
  Heart,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  TrendingUp,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user, signOut } = useAuthStore();
  const [stats, setStats] = useState({
    purchases: 0,
    favorites: 0,
    notesPublished: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [purchases, favorites, notes] = await Promise.all([
        supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      ]);

      setStats({
        purchases: purchases.count || 0,
        favorites: favorites.count || 0,
        notesPublished: notes.count || 0,
      });
    };

    fetchStats();
  }, [user, supabase]);

  const menuItems = [
    {
      icon: BookOpen,
      label: 'Mi biblioteca',
      href: '/library',
      color: 'text-udd-blue',
    },
    {
      icon: Heart,
      label: 'Favoritos',
      href: '/favorites',
      color: 'text-red-500',
    },
    {
      icon: Star,
      label: 'Mis reservas',
      href: '/bookings',
      color: 'text-udd-gold',
    },
    {
      icon: CreditCard,
      label: 'Métodos de pago',
      href: '#',
      color: 'text-udd-sky',
    },
    {
      icon: HelpCircle,
      label: 'Ayuda',
      href: '#',
      color: 'text-udd-gray',
    },
  ];

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Mi perfil" />

      {/* Profile Header */}
      <div className="px-4 py-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-udd-deep/10 flex items-center justify-center">
              <span className="text-xl font-bold text-udd-deep">
                {getInitials(user?.full_name || 'EU')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-udd-graphite">
                  {user?.full_name || 'Estudiante UDD'}
                </h1>
                {user?.verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-sm text-udd-gray mt-0.5">
                {user?.major || 'Carrera no especificada'}
              </p>
              <p className="text-xs text-udd-gray mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-udd-blue">{stats.purchases}</p>
              <p className="text-xs text-udd-gray">Compras</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-udd-blue">{stats.favorites}</p>
              <p className="text-xs text-udd-gray">Favoritos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-udd-blue">{stats.notesPublished}</p>
              <p className="text-xs text-udd-gray">Publicados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Creator Mode Toggle */}
      <div className="px-4 mb-4">
        <Link href="/profile/creator">
          <Card className="flex items-center gap-3 bg-gradient-to-r from-udd-deep to-udd-blue text-white">
            <TrendingUp size={20} />
            <div className="flex-1">
              <p className="text-sm font-semibold">Modo creador</p>
              <p className="text-xs text-white/70">Gestiona tus publicaciones y clases</p>
            </div>
            <ChevronRight size={18} />
          </Card>
        </Link>
      </div>

      {/* Menu */}
      <div className="px-4">
        <Card padding="none">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-udd-gray/5 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Icon size={20} className={item.color} />
                <span className="flex-1 text-sm font-medium text-udd-graphite">
                  {item.label}
                </span>
                <ChevronRight size={16} className="text-udd-gray" />
              </Link>
            );
          })}
        </Card>
      </div>

      {/* Sign Out */}
      <div className="px-4 mt-4 pb-8">
        <Button
          variant="ghost"
          fullWidth
          onClick={signOut}
          className="text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} className="mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
