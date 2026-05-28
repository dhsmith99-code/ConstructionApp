import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, Camera, ClipboardCheck, MapPin, ArrowRight, Pencil, Trash2, TrendingUp, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  on_hold: 'bg-amber-100 text-amber-800 border-amber-200',
  planning: 'bg-purple-100 text-purple-800 border-purple-200',
};

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  planning: 'Planning',
};

export default function ProjectCard({ project, onEdit, onDelete, delay = 0 }) {
  const { isManagement } = useRole();
  const phase = project.phase ?? 'sales';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-card border border-border overflow-hidden hover:shadow-md transition-shadow group"
    >
      <Link to={`/projects/${project.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 bg-muted flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                'text-xs font-semibold px-2.5 py-0.5 border',
                STATUS_COLORS[project.status] || 'bg-muted text-muted-foreground border-border'
              )}
            >
              {STATUS_LABELS[project.status] || project.status}
            </span>
            {/* Phase badge — only shown to management so construction workers don't see "Sales" */}
            {isManagement && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 border',
                  phase === 'construction'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {phase === 'construction'
                  ? <><HardHat className="w-2.5 h-2.5" /> Construction</>
                  : <><TrendingUp className="w-2.5 h-2.5" /> Sales</>}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-serif text-lg font-semibold text-foreground mb-1 line-clamp-1">
          {project.name}
        </h3>

        {project.client && (
          <p className="text-sm text-muted-foreground mb-1">{project.client}</p>
        )}

        {project.address && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">{project.address}</span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="w-3.5 h-3.5" />
            <span>Photos</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Punch List</span>
          </div>
          <div className="ml-auto">
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </Link>

      {(onEdit || onDelete) && (
        <div className="flex gap-1 px-5 pb-4">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)} className="h-7 px-2 text-xs">
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(project)}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
