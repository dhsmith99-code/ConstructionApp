import React, { useState, useEffect } from 'react';
import { db as base44 } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
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
import { Pencil, User, Phone, Mail, DollarSign, TrendingUp, Tag, StickyNote } from 'lucide-react';

const LEAD_STATUSES = [
  { value: 'prospect', label: 'Prospect', color: 'bg-slate-100 text-slate-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-700' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-700' },
  { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

const LEAD_SOURCES = [
  'Referral', 'Website', 'Advertisement', 'Cold Call',
  'Repeat Client', 'Social Media', 'Trade Show', 'Other',
];

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function SalesLeadTab({ project, onSaved }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    salesperson: '',
    lead_source: '',
    lead_status: 'prospect',
    estimated_value: '',
    contact_phone: '',
    contact_email: '',
    lead_notes: '',
  });

  useEffect(() => {
    setForm({
      salesperson: project.salesperson || '',
      lead_source: project.lead_source || '',
      lead_status: project.lead_status || 'prospect',
      estimated_value: project.estimated_value || '',
      contact_phone: project.contact_phone || '',
      contact_email: project.contact_email || '',
      lead_notes: project.lead_notes || '',
    });
  }, [project]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Project.update(project.id, form);
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      onSaved?.();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const statusObj = LEAD_STATUSES.find((s) => s.value === project.lead_status);

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Salesperson</label>
            <Input value={form.salesperson} onChange={set('salesperson')} placeholder="Sales rep name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lead Status</label>
            <Select value={form.lead_status} onValueChange={setVal('lead_status')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lead Source</label>
            <Select value={form.lead_source} onValueChange={setVal('lead_source')}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Lead Notes</label>
          <Textarea value={form.lead_notes} onChange={set('lead_notes')} placeholder="Any notes about this lead…" rows={3} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  const hasAnyData = project.salesperson || project.lead_source || project.lead_status
    || project.estimated_value || project.contact_phone || project.contact_email || project.lead_notes;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold">Sales Lead</h2>
          <p className="text-sm text-muted-foreground">Track the origin and status of this project opportunity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
      </div>

      {!hasAnyData ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sales lead info yet.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Add Lead Info
          </Button>
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl">
          {statusObj && (
            <div className="flex items-center gap-2">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusObj.color}`}>
                {statusObj.label}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-muted/40 rounded-xl">
            <InfoRow icon={User} label="Salesperson" value={project.salesperson} />
            <InfoRow icon={Tag} label="Lead Source" value={project.lead_source} />
            <InfoRow icon={DollarSign} label="Estimated Value" value={project.estimated_value} />
            <InfoRow icon={Phone} label="Contact Phone" value={project.contact_phone} />
            <InfoRow icon={Mail} label="Contact Email" value={project.contact_email} />
          </div>
          {project.lead_notes && (
            <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lead Notes</p>
                <p className="text-sm whitespace-pre-wrap">{project.lead_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
