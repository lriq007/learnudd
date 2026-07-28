import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gold';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

function Badge({ variant = 'default', size = 'sm', className, children }: BadgeProps) {
  const variants = {
    default: 'bg-udd-gray/10 text-udd-gray',
    primary: 'bg-udd-blue/10 text-udd-blue',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    gold: 'bg-udd-gold/10 text-udd-gold',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
