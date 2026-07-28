'use client';

import { Brain } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { AIDeclaration } from '@/types';

interface AIDeclarationBadgeProps {
  declaration: AIDeclaration;
  details?: string | null;
}

function AIDeclarationBadge({ declaration, details }: AIDeclarationBadgeProps) {
  if (declaration === 'none') return null;

  return (
    <div className="flex items-start gap-2 p-3 bg-udd-sky/5 rounded-xl border border-udd-sky/10">
      <Brain size={16} className="text-udd-sky mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-udd-graphite">
            {declaration === 'assisted'
              ? 'Asistido por IA'
              : 'Generado con IA'}
          </span>
          <Badge variant={declaration === 'assisted' ? 'primary' : 'warning'} size="sm">
            {declaration === 'assisted' ? 'Revisado' : 'Requiere revisión'}
          </Badge>
        </div>
        {details && (
          <p className="text-xs text-udd-gray mt-1">{details}</p>
        )}
      </div>
    </div>
  );
}

export { AIDeclarationBadge };
