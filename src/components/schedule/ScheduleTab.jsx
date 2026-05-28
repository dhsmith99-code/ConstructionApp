import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/EmptyState';
import { CalendarDays, Plus, Trash2, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ScheduleCalendar from './ScheduleCalendar';
import TaskDialog from './TaskDialog';

const formatDate = (d) => {
  if (!d) return '—';
  try { return format(parseISO(d), 'MMM d'); } catch { return d; }
};

export default function ScheduleTab({ projectId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultDate, setDefaultDate] = useState('');
  const qc = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['schedule', projectId],
    queryFn: () => base44.entities.ScheduleTask.filter({ project_id: projectId }, 'start_date'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['schedule', projectId] });

  const openNew = (date = '') => {
    setEditing(null);
    setDefaultDate(date);
    setDialogOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setDefaultDate('');
    setDialogOpen(true);
  };

  const handleSave = async (formData) => {
    const payload = { ...formData, project_id: projectId };
    if (editing) {
      await base44.entities.ScheduleTask.update(editing.id, payload);
    } else {
      await base44.entities.ScheduleTask.create(payload);
    }
    refresh();
    setDialogOpen(false);
  };

  const handleDelete = async (task) => {
    if (!confirm('Delete this task?')) return;
    await base44.entities.ScheduleTask.delete(task.id);
    refresh();
  };

  const handleTaskDrop = async (task, newDateStr) => {
    await base44.entities.ScheduleTask.update(task.id, { start_date: newDateStr });
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      <div className="bg-card rounded-none border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold">Calendar</h3>
          <Button size="sm" onClick={() => openNew()}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Task
          </Button>
        </div>
        <ScheduleCalendar
          tasks={tasks}
          onTaskDrop={handleTaskDrop}
          onDayClick={(dateStr) => openNew(dateStr)}
          onTaskClick={(task) => openEdit(task)}
        />
      </div>

      {/* Task List */}
      <div>
        <h3 className="font-serif text-lg font-semibold mb-3">All Tasks</h3>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No schedule yet"
            description="Click a day on the calendar or use Add Task to get started."
            action={<Button size="sm" onClick={() => openNew()}><Plus className="w-4 h-4 mr-1" />Add Task</Button>}
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-4 bg-card rounded-none border border-border">
                <div
                  className="w-3 h-3 rounded-none shrink-0"
                  style={{ backgroundColor: task.color || '#FBBF24' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.trade && task.trade !== 'general' && (
                      <span className="text-xs px-2 py-0.5 rounded-none bg-muted text-muted-foreground capitalize">
                        {task.trade}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="text-xs text-muted-foreground">· {task.assignee}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(task.start_date)}
                    {task.duration_days > 1 ? ` · ${task.duration_days} days` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(task)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        task={editing}
        defaultDate={defaultDate}
      />
    </div>
  );
}
