import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db as base44 } from '@/api/supabaseClient';
import PageHeader from '@/components/PageHeader';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Plus, Star, Flame, Thermometer, Snowflake,
  ArrowRight, MapPin, User, DollarSign, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';

const TEMP_CONFIG = {
  hot:  { icon: Flame,       label: 'Hot',  color: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
  warm: { icon: Thermometer, label: 'Warm', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  cold: { icon: Snowflake,   label: 'Cold', color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
};

const LEAD_STATUS_COLORS = {
  prospect:       'bg-gray-100 text-gray-700',
  qualified:      'bg-blue-100 text-blue-700',
  proposal_sent:  'bg-purple-100 text-purple-700',
  won:            'bg-emerald-100 text-emerald-700',
  lost:           'bg-red-100 text-red-700',
};

const LEAD_STATUS_LABELS = {
  prospect:      'Prospect',
  qualified:     'Qualified',
  proposal_sent: 'Proposal Sent',
  won:           'Won',
  lost:          'Lost',
};

function StarDisplay({ rating = 0 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn(
            'w-3.5 h-3.5',
            n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'
          )}
        />
      ))}
    </div>
  );
}

function LeadCard({ project, onEdit, delay = 0 }) {
  const temp = TEMP_CONFIG[project.lead_temperature];
  const TempIcon = temp?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="bg-card border border-border hover:shadow-md transition-shadow group"
    >
      <Link to={`/projects/${project.id}`} className="block p-5">
        {/* Top row: name + status + temperature */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-base font-semibold line-clamp-1">{project.name}</h3>
            {project.client && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3" /> {project.client}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {project.lead_status && (
              <span className={cn('text-xs font-medium px-2 py-0.5', LEAD_STATUS_COLORS[project.lead_status])}>
                {LEAD_STATUS_LABELS[project.lead_status] ?? project.lead_status}
              </span>
            )}
            {temp && (
              <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 border', temp.bg, temp.color)}>
                <TempIcon className="w-3 h-3" /> {temp.label}
              </span>
            )}
          </div>
        </div>

        {/* Rating + win probability */}
        <div className="flex items-center justify-between mb-3">
          <StarDisplay rating={project.lead_rating ?? 0} />
          {project.win_probability != null && (
            <div className="flex items-center gap-2">
              <div className="w-20 bg-muted h-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${project.win_probability}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {project.win_probability}%
              </span>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 border-t border-border">
          {project.estimated_value && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              {project.estimated_value}
            </span>
          )}
          {project.address && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1 max-w-[140px]">{project.address}</span>
            </span>
          )}
          {project.salesperson && (
            <span className="text-xs text-muted-foreground ml-auto">
              {project.salesperson}
            </span>
          )}
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
        </div>
      </Link>

      {onEdit && (
        <div className="px-5 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.preventDefault(); onEdit(project); }}
            className="h-7 px-2 text-xs"
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Group leads by status for a simple pipeline view
const PIPELINE_ORDER = ['prospect', 'qualified', 'proposal_sent', 'won', 'lost'];

export default function SalesLeads() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'pipeline'
  const qc = useQueryClient();
  const { isManagement, isSales } = useRole();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  // Only sales-phase projects
  const leads = projects.filter(p => (p.phase ?? 'sales') === 'sales');

  const refresh = () => qc.invalidateQueries({ queryKey: ['projects'] });
  const handleEdit = (project) => { setEditing(project); setOpen(true); };

  // Pipeline grouping
  const grouped = PIPELINE_ORDER.reduce((acc, status) => {
    const items = leads.filter(p => p.lead_status === status);
    if (items.length > 0) acc[status] = items;
    return acc;
  }, {});
  // Ungrouped (no lead_status set)
  const unset = leads.filter(p => !p.lead_status);
  if (unset.length) grouped['_none'] = unset;

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Sales Leads"
        description="Manage your pipeline from first contact to won job."
        action={
          (isManagement || isSales) && (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Lead
            </Button>
          )
        }
      />

      {/* View toggle + summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: <strong className="text-foreground">{leads.length}</strong></span>
          <span>Hot: <strong className="text-red-600">{leads.filter(p => p.lead_temperature === 'hot').length}</strong></span>
          <span>Warm: <strong className="text-amber-600">{leads.filter(p => p.lead_temperature === 'warm').length}</strong></span>
        </div>
        <div className="flex border border-border">
          <button
            onClick={() => setView('list')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            List
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
              view === 'pipeline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Pipeline
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse" />)}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales leads yet"
          description="Create your first lead to start tracking the pipeline."
          action={
            (isManagement || isSales) && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Lead
              </Button>
            )
          }
        />
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((project, i) => (
            <LeadCard
              key={project.id}
              project={project}
              delay={i * 0.04}
              onEdit={isManagement || isSales ? handleEdit : null}
            />
          ))}
        </div>
      ) : (
        /* Pipeline view — grouped by lead status */
        <div className="space-y-8">
          {Object.entries(grouped).map(([status, items]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {status === '_none' ? 'No Status' : (LEAD_STATUS_LABELS[status] ?? status)}
                </h3>
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((project, i) => (
                  <LeadCard
                    key={project.id}
                    project={project}
                    delay={i * 0.03}
                    onEdit={isManagement || isSales ? handleEdit : null}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={open}
        onOpenChange={setOpen}
        project={editing}
        onSaved={refresh}
      />
    </div>
  );
}
