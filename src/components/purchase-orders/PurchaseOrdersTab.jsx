import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmptyState from '@/components/EmptyState';
import { ShoppingCart, Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  ordered: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const EMPTY = { vendor: '', description: '', amount: '', status: 'pending', order_date: '' };

function PODialog({ open, onOpenChange, po, projectId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm(po ? { vendor: po.vendor || '', description: po.description || '', amount: po.amount || '', status: po.status || 'pending', order_date: po.order_date || '' } : EMPTY);
  }, [po, open]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const setV = (f) => (v) => setForm((s) => ({ ...s, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, project_id: projectId, amount: form.amount ? Number(form.amount) : undefined };
      if (po) await base44.entities.PurchaseOrder.update(po.id, data);
      else await base44.entities.PurchaseOrder.create(data);
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{po ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Vendor *</label>
            <Input value={form.vendor} onChange={set('vendor')} placeholder="Vendor name" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input value={form.description} onChange={set('description')} placeholder="What was ordered?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount ($)</label>
              <Input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={setV('status')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Order Date</label>
            <Input type="date" value={form.order_date} onChange={set('order_date')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : po ? 'Save' : 'Create PO'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PurchaseOrdersTab({ projectId }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: pos = [] } = useQuery({
    queryKey: ['pos', projectId],
    queryFn: () => base44.entities.PurchaseOrder.filter({ project_id: projectId }, '-order_date'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['pos', projectId] });

  const handleDelete = async (po) => {
    if (!confirm('Delete this purchase order?')) return;
    await base44.entities.PurchaseOrder.delete(po.id);
    refresh();
  };

  const total = pos.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {pos.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">${total.toLocaleString()}</span>
          </p>
        )}
        <Button size="sm" className="ml-auto" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> New PO
        </Button>
      </div>

      {pos.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders" description="Track vendor orders and deliveries." action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" />New PO</Button>} />
      ) : (
        <div className="space-y-2">
          {pos.map((po) => (
            <div key={po.id} className="flex items-center gap-3 p-4 bg-card rounded-none border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{po.vendor}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-none font-medium', STATUS_COLORS[po.status] || 'bg-muted text-muted-foreground')}>
                    {po.status}
                  </span>
                </div>
                {po.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{po.description}</p>}
                {po.amount && <p className="text-sm font-semibold mt-1">${Number(po.amount).toLocaleString()}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(po); setOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(po)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PODialog open={open} onOpenChange={setOpen} po={editing} projectId={projectId} onSaved={refresh} />
    </div>
  );
}
