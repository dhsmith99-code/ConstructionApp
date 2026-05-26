import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import PunchItemCard from '@/components/punch/PunchItemCard';
import PunchItemDialog from '@/components/punch/PunchItemDialog';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export default function PunchList() {
  const [tab, setTab] = useState('open');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['punch'],
    queryFn: () => base44.entities.PunchItem.list('-updated_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects]
  );

  const filtered = useMemo(() => {
    let result = items;
    if (tab === 'open') result = result.filter((i) => i.status !== 'completed');
    if (tab === 'completed') result = result.filter((i) => i.status === 'completed');
    if (projectFilter !== 'all') result = result.filter((i) => i.project_id === projectFilter);
    return result;
  }, [items, tab, projectFilter]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['punch'] });

  const handleToggle = async (item) => {
    const newStatus = item.status === 'completed' ? 'open' : 'completed';
    const patch = { status: newStatus };
    if (newStatus === 'completed') patch.completed_date = new Date().toISOString().split('T')[0];
    await base44.entities.PunchItem.update(item.id, patch);
    refresh();
  };

  const handleDelete = async (item) => {
    if (!confirm('Delete this punch item?')) return;
    await base44.entities.PunchItem.delete(item.id);
    refresh();
  };

  const openCount = items.filter((i) => i.status !== 'completed').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div>
      <PageHeader
        eyebrow="Quality"
        title="Punch List"
        description="Track and resolve outstanding items."
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Item
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-border bg-muted p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {key === 'open' && openCount > 0 && (
                <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Project Filter */}
        {projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={tab === 'completed' ? 'Nothing completed yet' : 'All clear'}
          description={
            tab === 'completed'
              ? 'Completed items will appear here.'
              : 'Add punch items as you walk the site.'
          }
          action={
            tab !== 'completed' && (
              <Button onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> New Item
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <PunchItemCard
              key={item.id}
              item={item}
              index={i}
              projectName={projectsById[item.project_id]?.name}
              onToggle={handleToggle}
              onEdit={(it) => { setEditing(it); setOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <PunchItemDialog
        open={open}
        onOpenChange={setOpen}
        item={editing}
        projects={projects}
        onSaved={refresh}
      />
    </div>
  );
}
