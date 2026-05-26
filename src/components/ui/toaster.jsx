import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all',
            t.open ? 'animate-in slide-in-from-bottom-5' : 'animate-out slide-out-to-right-5 opacity-0',
            t.variant === 'destructive'
              ? 'bg-destructive text-destructive-foreground border-destructive'
              : 'bg-card text-card-foreground border-border'
          )}
        >
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm opacity-80 mt-0.5">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
