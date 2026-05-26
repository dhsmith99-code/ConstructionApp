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
  salesperson: '', lead_source: '', lead_status: 'prospect',
  estimated_value: '', contact_phone: '', contact_email: '', lead_notes: '',
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
        salesperson: project.salesperson || '',
        lead_source: project.lead_source || '',
        lead_status: project.lead_status || 'prospect',
        estimated_value: project.estimated_value || '',
        contact_phone: project.contact_phone || '',
        contact_email: project.contact_email || '',
        lead_notes: project.lead_notes || '',
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

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">Sales Lead</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salesperson</label>
                <Input value={form.salesperson} onChange={set('salesperson')} placeholder="Sales rep name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lead Status</label>
                <Select value={form.lead_status} onValueChange={setVal('lead_status')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lead Source</label>
                <Select value={form.lead_source} onValueChange={setVal('lead_source')}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {['Referral','Website','Advertisement','Cold Call','Repeat Client','Social Media','Trade Show','Other'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estimated Value</label>
                <Input value={form.estimated_value} onChange={set('estimated_value')} placeholder="e.g. $125,000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contact Phone</label>
                <Input value={form.contact_phone} onChange={set('contact_phone')} placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contact Email</label>
                <Input value={form.contact_email} onChange={set('contact_email')} placeholder="client@email.com" type="email" />
              </div>
            </div>
            <div className="space-y-1.5 mt-4">
              <label className="text-sm font-medium">Lead Notes</label>
              <Textarea value={form.lead_notes} onChange={set('lead_notes')} placeholder="Notes about this lead…" rows={2} />
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
