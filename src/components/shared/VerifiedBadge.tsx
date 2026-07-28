import { Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  type?: 'identity' | 'content';
  size?: 'sm' | 'md';
  className?: string;
}

function VerifiedBadge({ type = 'identity', size = 'sm', className }: VerifiedBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
  };

  const icons = {
    identity: <Shield size={size === 'sm' ? 12 : 14} />,
    content: <CheckCircle size={size === 'sm' ? 12 : 14} />,
  };

  const labels = {
    identity: 'UDD verificado',
    content: 'Contenido verificado',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        'bg-udd-blue/10 text-udd-blue',
        sizes[size],
        className
      )}
    >
      {icons[type]}
      {labels[type]}
    </span>
  );
}

export { VerifiedBadge };
