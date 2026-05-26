import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import EmptyState from '@/components/EmptyState';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';

function PlanDialog({ open, onOpenChange, projectId, onSaved }) {
  const [form, setForm] = useState({ name: '', file_url: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Plan.create({ ...form, project_id: projectId });
      onSaved?.();
      onOpenChange(false);
      setForm({ name: '', file_url: '', description: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plan Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Floor Plan Rev 3"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">File URL</label>
            <Input
              value={form.file_url}
              onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
              placeholder="https://example.com/plan.pdf"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Notes about this plan…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Plan'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PlansTab({ projectId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const qc = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', projectId],
    queryFn: () => base44.entities.Plan.filter({ project_id: projectId }),
  });

  const handleDelete = async (plan) => {
    if (!confirm('Delete this plan?')) return;
    await base44.entities.Plan.delete(plan.id);
    qc.invalidateQueries({ queryKey: ['plans', projectId] });
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['plans', projectId] });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No plans yet"
          description="Upload plan files or link to drawings."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Plan</Button>}
        />
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{plan.name}</p>
                {plan.description && <p className="text-xs text-muted-foreground truncate">{plan.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {plan.file_url && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={plan.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(plan)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} onSaved={refresh} />
    </div>
  );
}
