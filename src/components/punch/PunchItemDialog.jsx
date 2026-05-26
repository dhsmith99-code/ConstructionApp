import React, { useState, useEffect } from 'react';
import { db as base44 } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY = { title: '', description: '', project_id: '', assigned_to: '', status: 'open' };

export default function PunchItemDialog({ open, onOpenChange, item, projects = [], onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        description: item.description || '',
        project_id: item.project_id || '',
        assigned_to: item.assigned_to || '',
        status: item.status || 'open',
      });
    } else {
      setForm(EMPTY);
    }
  }, [item, open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = { ...form, project_id: form.project_id || undefined };
      if (item) {
        await base44.entities.PunchItem.update(item.id, data);
      } else {
        await base44.entities.PunchItem.create(data);
      }
      qc.invalidateQueries({ queryKey: ['punch'] });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Punch Item' : 'New Punch Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input value={form.title} onChange={set('title')} placeholder="What needs to be done?" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={set('description')} placeholder="Additional details…" rows={2} />
          </div>
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Project</label>
              <Select value={form.project_id} onValueChange={setVal('project_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assigned To</label>
              <Input value={form.assigned_to} onChange={set('assigned_to')} placeholder="Name or trade" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={setVal('status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
