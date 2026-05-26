import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Pencil, Trash2, User, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PunchItemCard({ item, index = 0, projectName, onToggle, onEdit, onDelete }) {
  const isComplete = item.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={cn(
        'bg-card rounded-xl border p-4 transition-colors',
        isComplete ? 'border-border opacity-70' : 'border-border hover:border-primary/30'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle?.(item)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium leading-snug',
              isComplete && 'line-through text-muted-foreground'
            )}
          >
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {projectName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FolderKanban className="w-3 h-3" />
                {projectName}
              </span>
            )}
            {item.assigned_to && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {item.assigned_to}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(item)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
