import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Parse base44-style orderBy strings like '-updated_date' or 'start_date'
function parseOrder(orderBy) {
  if (!orderBy) return null;
  const desc = orderBy.startsWith('-');
  const col = desc ? orderBy.slice(1) : orderBy;
  return { col, ascending: !desc };
}

function makeEntity(table) {
  return {
    async list(orderBy) {
      let q = supabase.from(table).select('*');
      const o = parseOrder(orderBy);
      if (o) q = q.order(o.col, { ascending: o.ascending });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async filter(conditions = {}, orderBy) {
      let q = supabase.from(table).select('*');
      Object.entries(conditions).forEach(([k, v]) => {
        q = q.eq(k, v);
      });
      const o = parseOrder(orderBy);
      if (o) q = q.order(o.col, { ascending: o.ascending });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async create(data) {
      const { data: row, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return row;
    },

    async update(id, data) {
      const payload = { ...data, updated_date: new Date().toISOString() };
      const { data: row, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return row;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// Drop-in replacement for base44.entities — same interface, Supabase backend
export const db = {
  entities: {
    Project: makeEntity('projects'),
    Photo: makeEntity('photos'),
    PunchItem: makeEntity('punch_items'),
    Plan: makeEntity('plans'),
    PurchaseOrder: makeEntity('purchase_orders'),
    Selection: makeEntity('selections'),
    ScheduleTask: makeEntity('schedule_tasks'),
  },
};
