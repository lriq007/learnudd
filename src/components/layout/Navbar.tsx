'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/explore', icon: Search, label: 'Explorar' },
  { href: '/publish', icon: PlusCircle, label: 'Publicar', isSpecial: true },
  { href: '/messages', icon: MessageCircle, label: 'Mensajes' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-[430px] mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all',
                    'bg-udd-blue text-white hover:bg-udd-blue/90'
                  )}
                >
                  <Icon size={24} />
                </div>
                <span className="text-[10px] mt-1 text-udd-gray font-medium">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-lg transition-colors',
                active ? 'text-udd-blue' : 'text-udd-gray hover:text-udd-graphite'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { Navbar };
