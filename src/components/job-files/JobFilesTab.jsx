import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmptyState from '@/components/EmptyState';
import { FolderOpen, Plus, Trash2, ExternalLink, FileCheck, Receipt, FilePen, File, Shield, ClipboardList } from 'lucide-react';

const CATEGORIES = [
  { value: 'contract',     label: 'Contract',      icon: FileCheck },
  { value: 'permit',       label: 'Permit',         icon: FilePen },
  { value: 'insurance',    label: 'Insurance',      icon: Shield },
  { value: 'invoice',      label: 'Invoice',        icon: Receipt },
  { value: 'change_order', label: 'Change Order',   icon: ClipboardList },
  { value: 'inspection',   label: 'Inspection',     icon: FileCheck },
  { value: 'other',        label: 'Other',          icon: File },
];

function AddFileDialog({ open, onOpenChange, projectId, onSaved }) {
  const [form, setForm] = useState({ name: '', category: 'contract', file_url: '', notes: '' });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) setForm({ name: '', category: 'contract', file_url: '', notes: '' });
  }, [open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.JobFile.create({ ...form, project_id: projectId });
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Add Job File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">File Name *</label>
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Signed Contract — Smith Residence" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={form.category} onValueChange={setVal('category')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">File URL</label>
            <Input value={form.file_url} onChange={set('file_url')} placeholder="https://drive.google.com/… or Dropbox link" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Input value={form.notes} onChange={set('notes')} placeholder="Optional notes about this file…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add File'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function JobFilesTab({ projectId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const qc = useQueryClient();

  const { data: files = [] } = useQuery({
    queryKey: ['job-files', projectId],
    queryFn: () => base44.entities.JobFile.filter({ project_id: projectId }, '-created_date'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['job-files', projectId] });

  const handleDelete = async (file) => {
    if (!confirm('Delete this file?')) return;
    await base44.entities.JobFile.delete(file.id);
    refresh();
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = files.filter((f) => f.category === cat.value);
    if (items.length) acc[cat.value] = { ...cat, items };
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add File
        </Button>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No job files yet"
          description="Store contracts, permits, insurance docs, and other important files here."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Add File</Button>}
        />
      ) : (
        <div className="space-y-6">
          {Object.values(grouped).map(({ value, label, icon: Icon, items }) => (
            <div key={value}>
              <h4 className="font-serif text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {label}
              </h4>
              <div className="space-y-2">
                {items.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-4 bg-card rounded-none border border-border">
                    <div className="w-9 h-9 rounded-none bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      {file.notes && <p className="text-xs text-muted-foreground truncate">{file.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {file.file_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(file)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddFileDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} onSaved={refresh} />
    </div>
  );
}
