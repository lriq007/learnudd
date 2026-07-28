'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

function RatingStars({
  rating,
  maxRating = 5,
  size = 'sm',
  showValue = true,
  showCount = false,
  count,
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const sizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const halfFilled = !filled && i < rating;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(i + 1)}
              className={cn(
                'relative',
                interactive && 'cursor-pointer hover:scale-110 transition-transform'
              )}
            >
              <Star
                size={sizes[size]}
                className={cn(
                  'transition-colors',
                  filled
                    ? 'fill-udd-gold text-udd-gold'
                    : halfFilled
                    ? 'fill-udd-gold/50 text-udd-gold'
                    : 'fill-udd-gray/20 text-udd-gray/20'
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={cn('font-semibold text-udd-graphite', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && count !== undefined && (
        <span className={cn('text-udd-gray', textSizes[size])}>
          ({count})
        </span>
      )}
    </div>
  );
}

export { RatingStars };
