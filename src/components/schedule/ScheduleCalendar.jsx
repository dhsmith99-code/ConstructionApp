import React, { useState, useRef } from 'react';
import {
  addDays, format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay,
  parseISO, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function contrastColor(hex) {
  const { r, g, b } = hexToRgb(hex || '#FBBF24');
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export default function ScheduleCalendar({ tasks, onTaskDrop, onDayClick, onTaskClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState(null);
  const dragTaskRef = useRef(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  // Build grid days
  const days = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Map tasks to date cells — a task with duration spans multiple days
  const tasksByDay = {};
  tasks.forEach(task => {
    if (!task.start_date) return;
    const start = parseISO(task.start_date);
    const duration = task.duration_days || 1;
    for (let d = 0; d < duration; d++) {
      const dateKey = format(addDays(start, d), 'yyyy-MM-dd');
      if (!tasksByDay[dateKey]) tasksByDay[dateKey] = [];
      tasksByDay[dateKey].push({ ...task, _dayIndex: d, _isFirst: d === 0, _isLast: d === duration - 1 });
    }
  });

  // Drag handlers
  const handleDragStart = (e, task) => {
    dragTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id); // required by Firefox & most browsers
  };

  const handleDragEnd = () => {
    dragTaskRef.current = null;
    setDragOverDate(null);
  };

  const handleDragOver = (e, dateKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the cell entirely (not moving over a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e, date) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);
    if (!dragTaskRef.current) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    onTaskDrop(dragTaskRef.current, dateStr);
    dragTaskRef.current = null;
  };

  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    if (!onTaskClick) return;
    // Strip internal calendar fields before passing back up
    const { _dayIndex, _isFirst, _isLast, ...cleanTask } = task;
    onTaskClick(cleanTask);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="font-serif text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t">
        {days.map((d, i) => {
          const dateKey = format(d, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[dateKey] || [];
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isToday = isSameDay(d, new Date());
          const isDragOver = dragOverDate === dateKey;

          return (
            <div
              key={i}
              className={cn(
                'border-r border-b min-h-[90px] p-1 cursor-pointer transition-colors',
                !isCurrentMonth && 'bg-muted/30',
                isToday && 'bg-accent/10',
                isDragOver && 'bg-primary/10 ring-2 ring-inset ring-primary/30',
              )}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, d)}
              onClick={() => onDayClick && onDayClick(dateKey)}
            >
              <div className={cn(
                'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                !isCurrentMonth && 'opacity-40'
              )}>
                {format(d, 'd')}
              </div>

              <div className="space-y-0.5">
                {dayTasks.map((task, ti) => {
                  const color = task.color || '#FBBF24';
                  const textColor = contrastColor(color);
                  return (
                    <div
                      key={`${task.id}-${ti}`}
                      draggable={task._isFirst}
                      onDragStart={task._isFirst ? (e) => handleDragStart(e, task) : undefined}
                      onDragEnd={task._isFirst ? handleDragEnd : undefined}
                      onClick={(e) => handleTaskClick(e, task)}
                      className={cn(
                        'text-xs px-1.5 py-0.5 truncate',
                        task._isFirst ? 'rounded-l-full cursor-grab active:cursor-grabbing' : 'rounded-l-none cursor-pointer',
                        task._isLast ? 'rounded-r-full' : 'rounded-r-none',
                      )}
                      style={{ backgroundColor: color, color: textColor }}
                      title={task.title}
                    >
                      {task._isFirst ? task.title : ' '}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
