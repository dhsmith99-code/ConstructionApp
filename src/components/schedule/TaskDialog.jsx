import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TRADE_OPTIONS = [
  'general', 'electrical', 'plumbing', 'hvac',
  'carpentry', 'painting', 'flooring', 'drywall',
  'roofing', 'landscaping', 'other'
];

const PRESET_COLORS = [
  '#FBBF24', '#F87171', '#34D399', '#60A5FA',
  '#A78BFA', '#F472B6', '#FB923C', '#4ADE80',
  '#38BDF8', '#E879F9',
];

export default function TaskDialog({ open, onClose, onSave, task, defaultDate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    duration_days: 1,
    trade: 'general',
    assignee: '',
    color: '#FBBF24',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        start_date: task.start_date || '',
        duration_days: task.duration_days || 1,
        trade: task.trade || 'general',
        assignee: task.assignee || '',
        color: task.color || '#FBBF24',
      });
    } else {
      setForm({
        title: '',
        description: '',
        start_date: defaultDate || '',
        duration_days: 1,
        trade: 'general',
        assignee: '',
        color: '#FBBF24',
      });
    }
  }, [task, defaultDate, open]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...task, ...form, duration_days: Number(form.duration_days) || 1 });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task name" />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Optional notes" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duration (days)</Label>
              <Input type="number" min={1} max={365} value={form.duration_days} onChange={e => set('duration_days', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Trade</Label>
              <Select value={form.trade} onValueChange={v => set('trade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADE_OPTIONS.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Assignee</Label>
              <Input value={form.assignee} onChange={e => set('assignee', e.target.value)} placeholder="Name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'scale-125 border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => set('color', c)}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border border-border"
                title="Custom color"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title.trim()}>
            {task ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
