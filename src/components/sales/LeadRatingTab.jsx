import React, { useState } from 'react';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Star, Flame, Thermometer, Snowflake, TrendingUp, Clock, Users, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

const TEMPERATURES = [
  { value: 'hot',  label: 'Hot',  icon: Flame,       color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'warm', label: 'Warm', icon: Thermometer,  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'cold', label: 'Cold', icon: Snowflake,    color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'w-7 h-7 transition-colors',
              n <= (hover || value)
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LeadRatingTab({ project, onSaved }) {
  const [form, setForm] = useState({
    lead_rating:      project.lead_rating      ?? 0,
    lead_temperature: project.lead_temperature ?? '',
    win_probability:  project.win_probability  ?? 50,
    decision_timeline: project.decision_timeline ?? '',
    competitor_info:  project.competitor_info  ?? '',
    rating_notes:     project.rating_notes     ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Project.update(project.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const temp = TEMPERATURES.find(t => t.value === form.lead_temperature);

  return (
    <div className="max-w-lg space-y-7">

      {/* Star Rating */}
      <Field label="Lead Rating" icon={Star}>
        <StarRating
          value={form.lead_rating}
          onChange={v => setForm(f => ({ ...f, lead_rating: v }))}
        />
        {form.lead_rating > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {['', 'Very weak', 'Weak', 'Average', 'Strong', 'Very strong'][form.lead_rating]} lead
          </p>
        )}
      </Field>

      {/* Temperature */}
      <Field label="Lead Temperature" icon={Thermometer}>
        <div className="flex gap-2">
          {TEMPERATURES.map(({ value, label, icon: TIcon, color }) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setForm(f => ({ ...f, lead_temperature: f.lead_temperature === value ? '' : value }))
              }
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium transition-colors',
                form.lead_temperature === value
                  ? color
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              <TIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* Win Probability */}
      <Field label="Win Probability" icon={TrendingUp}>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={form.win_probability}
            onChange={(e) =>
              setForm(f => ({ ...f, win_probability: parseInt(e.target.value) }))
            }
            className="flex-1 h-2 accent-primary cursor-pointer"
          />
          <span className="text-lg font-semibold tabular-nums w-12 text-right">
            {form.win_probability}%
          </span>
        </div>
        <div className="w-full bg-muted h-1.5 mt-1 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${form.win_probability}%` }}
          />
        </div>
      </Field>

      {/* Decision Timeline */}
      <Field label="Decision Timeline" icon={Clock}>
        <input
          type="text"
          value={form.decision_timeline}
          onChange={set('decision_timeline')}
          placeholder="e.g. End of Q3, Within 2 weeks…"
          className="w-full border border-input bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      {/* Competitors */}
      <Field label="Competing Bids" icon={Users}>
        <input
          type="text"
          value={form.competitor_info}
          onChange={set('competitor_info')}
          placeholder="Who else is bidding? Any known figures?"
          className="w-full border border-input bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>

      {/* Notes */}
      <Field label="Rating Notes" icon={StickyNote}>
        <textarea
          value={form.rating_notes}
          onChange={set('rating_notes')}
          placeholder="Why is this lead rated the way it is? What are the key factors?"
          rows={3}
          className="w-full border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </Field>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Rating'}
      </Button>
    </div>
  );
}
