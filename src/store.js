import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Supabase Postgres when configured; in-memory fallback so the bot can be
// developed and tested locally before Supabase exists.
const memory = new Map();
const processedIds = new Set();

let db = null;
if (config.supabaseUrl && config.supabaseKey) {
  db = createClient(config.supabaseUrl, config.supabaseKey);
} else {
  console.warn('[store] Supabase not configured — using in-memory store');
}

export const store = {
  async getGuest(phone) {
    if (!db) return memory.get(phone) || null;
    const { data, error } = await db
      .from('guests')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertGuest(phone, patch) {
    const row = { phone, ...patch, updated_at: new Date().toISOString() };
    if (!db) {
      const next = { ...(memory.get(phone) || {}), ...row };
      memory.set(phone, next);
      return next;
    }
    const { data, error } = await db
      .from('guests')
      .upsert(row, { onConflict: 'phone' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getGuestByPassId(passId) {
    if (!db) {
      for (const g of memory.values()) if (g.pass_id === passId) return g;
      return null;
    }
    const { data, error } = await db
      .from('guests')
      .select('*')
      .eq('pass_id', passId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getGuestByInviteId(inviteId) {
    if (!db) {
      for (const g of memory.values()) if (g.invite_id === inviteId) return g;
      return null;
    }
    const { data, error } = await db
      .from('guests')
      .select('*')
      .eq('invite_id', inviteId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Web RSVP dedupe: a resubmitted email should reuse the existing pass,
  // not mint a second one.
  async getGuestByEmail(email) {
    if (!db) {
      for (const g of memory.values()) if (g.email === email) return g;
      return null;
    }
    const { data, error } = await db
      .from('guests')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Guest list for the door search fallback.
  async listGuests() {
    if (!db) return [...memory.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const { data, error } = await db.from('guests').select('*').order('name');
    if (error) throw error;
    return data;
  },

  // Mark a pass used. Returns { guest, already } — 'already' is what catches
  // a shared or re-scanned pass at the door.
  async checkIn(passId, by) {
    const guest = await this.getGuestByPassId(passId);
    if (!guest) return { guest: null, already: false };
    if (guest.checked_in_at) return { guest, already: true };
    const checked_in_at = new Date().toISOString();
    if (!db) {
      Object.assign(guest, { checked_in_at, checked_in_by: by });
      return { guest, already: false };
    }
    // Update only while unchecked — a concurrent second scan sees the flag
    // already set rather than double-marking.
    const { data, error } = await db
      .from('guests')
      .update({ checked_in_at, checked_in_by: by })
      .eq('pass_id', passId)
      .is('checked_in_at', null)
      .select()
      .maybeSingle();
    if (error) throw error;
    return { guest: data || { ...guest, checked_in_at, checked_in_by: by }, already: !data };
  },

  // Webhook retries can deliver the same message twice (e.g. after a cold
  // start). Dedupe on Meta's message id.
  async seenMessage(id) {
    if (!db) {
      if (processedIds.has(id)) return true;
      processedIds.add(id);
      if (processedIds.size > 5000) processedIds.clear();
      return false;
    }
    const { error } = await db.from('processed_messages').insert({ id });
    // 23505 = unique violation → already processed
    if (error && error.code !== '23505') throw error;
    return error?.code === '23505';
  },
};
