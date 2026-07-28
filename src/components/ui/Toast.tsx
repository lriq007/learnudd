'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onClose]);

  const types = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-udd-blue text-white',
  };

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-3 rounded-xl shadow-lg',
        'flex items-center gap-2 min-w-[280px] max-w-[90vw]',
        'fade-in',
        types[type]
      )}
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          onClose();
        }}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export { Toast };
