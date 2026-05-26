import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmptyState from '@/components/EmptyState';
import { Palette, Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const EMPTY = { category: '', item: '', notes: '', status: 'pending' };

function SelectionDialog({ open, onOpenChange, selection, projectId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm(selection ? { category: selection.category || '', item: selection.item || '', notes: selection.notes || '', status: selection.status || 'pending' } : EMPTY);
  }, [selection, open]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const setV = (f) => (v) => setForm((s) => ({ ...s, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, project_id: projectId };
      if (selection) await base44.entities.Selection.update(selection.id, data);
      else await base44.entities.Selection.create(data);
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{selection ? 'Edit Selection' : 'New Selection'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category *</label>
              <Input value={form.category} onChange={set('category')} placeholder="e.g. Flooring, Paint" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={setV('status')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Item *</label>
            <Input value={form.item} onChange={set('item')} placeholder="Product name, color, model…" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Supplier, SKU, color code…" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : selection ? 'Save' : 'Add Selection'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SelectionsTab({ projectId }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: selections = [] } = useQuery({
    queryKey: ['selections', projectId],
    queryFn: () => base44.entities.Selection.filter({ project_id: projectId }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['selections', projectId] });

  const handleDelete = async (sel) => {
    if (!confirm('Delete this selection?')) return;
    await base44.entities.Selection.delete(sel.id);
    refresh();
  };

  const byCategory = selections.reduce((acc, s) => {
    const cat = s.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Selection
        </Button>
      </div>

      {selections.length === 0 ? (
        <EmptyState icon={Palette} title="No selections yet" description="Track finishes, fixtures, and material choices." action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Selection</Button>} />
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <h4 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</h4>
              <div className="space-y-2">
                {items.map((sel) => (
                  <div key={sel.id} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{sel.item}</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[sel.status] || 'bg-muted text-muted-foreground')}>{sel.status}</span>
                      </div>
                      {sel.notes && <p className="text-xs text-muted-foreground mt-0.5">{sel.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(sel); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(sel)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <SelectionDialog open={open} onOpenChange={setOpen} selection={editing} projectId={projectId} onSaved={refresh} />
    </div>
  );
}
