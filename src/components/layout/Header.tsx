'use client';

import Link from 'next/link';
import { Bell, ShoppingCart, ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showCart?: boolean;
  onSearchClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

function Header({
  title,
  showBack = false,
  showSearch = false,
  showNotifications = true,
  showCart = false,
  onSearchClick,
  rightAction,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-border',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-[430px] mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <Link
              href="javascript:history.back()"
              className="p-2 -ml-2 rounded-lg hover:bg-udd-gray/5 transition-colors"
            >
              <ArrowLeft size={20} className="text-udd-graphite" />
            </Link>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-udd-graphite truncate">
              {title}
            </h1>
          )}
          {!title && showSearch && (
            <button
              onClick={onSearchClick}
              className="flex items-center gap-2 px-3 py-2 bg-udd-gray/5 rounded-xl text-udd-gray text-sm w-full"
            >
              <Search size={16} />
              <span>Buscar...</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {rightAction}
          {showNotifications && (
            <Link
              href="/messages"
              className="p-2 rounded-lg hover:bg-udd-gray/5 transition-colors relative"
            >
              <Bell size={20} className="text-udd-graphite" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-udd-blue rounded-full" />
            </Link>
          )}
          {showCart && (
            <Link
              href="/library"
              className="p-2 rounded-lg hover:bg-udd-gray/5 transition-colors"
            >
              <ShoppingCart size={20} className="text-udd-graphite" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export { Header };
