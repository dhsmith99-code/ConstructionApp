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

const EMPTY = {
  name: '', status: 'planning', client: '', address: '', budget: '', notes: '',
  sales_rep: '', lead_source: '', lead_date: '', estimated_value: '', sales_notes: '',
};

export default function ProjectFormDialog({ open, onOpenChange, project, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        status: project.status || 'planning',
        client: project.client || '',
        address: project.address || '',
        budget: project.budget || '',
        notes: project.notes || '',
        sales_rep: project.sales_rep || '',
        lead_source: project.lead_source || '',
        lead_date: project.lead_date || '',
        estimated_value: project.estimated_value || '',
        sales_notes: project.sales_notes || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [project, open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (project) {
        await base44.entities.Project.update(project.id, form);
      } else {
        await base44.entities.Project.create(form);
      }
      qc.invalidateQueries({ queryKey: ['projects'] });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project Name *</label>
            <Input value={form.name} onChange={set('name')} placeholder="e.g. 123 Main St Renovation" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={setVal('status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Client</label>
              <Input value={form.client} onChange={set('client')} placeholder="Client name" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Address</label>
            <Input value={form.address} onChange={set('address')} placeholder="Project address" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Budget</label>
            <Input value={form.budget} onChange={set('budget')} placeholder="e.g. $250,000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" rows={3} />
          </div>

          {/* Sales Lead Section */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sales Lead</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Sales Rep</label>
                  <Input value={form.sales_rep} onChange={set('sales_rep')} placeholder="Rep name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Lead Source</label>
                  <Select value={form.lead_source} onValueChange={setVal('lead_source')}>
                    <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="repeat_client">Repeat Client</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="yard_sign">Yard Sign</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Lead Date</label>
                  <Input type="date" value={form.lead_date} onChange={set('lead_date')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Estimated Value</label>
                  <Input value={form.estimated_value} onChange={set('estimated_value')} placeholder="e.g. $50,000" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sales Notes</label>
                <Textarea value={form.sales_notes} onChange={set('sales_notes')} placeholder="Lead details, follow-up notes…" rows={2} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
