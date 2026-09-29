import { createClient } from '@supabase/supabase-js';

let client = null;

/**
 * Server-side Supabase client, created on first use so that the project can be
 * built without credentials. The service_role key bypasses row level security,
 * so this module must never be imported from a client component.
 */
function client_() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY. Copy .env.example to .env.local and fill it in.');
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** `db.from('rooms')...` - the same API as a Supabase client. */
export const db = {
  from: (table) => client_().from(table),
};

/** Throw Supabase errors so the route handler can turn them into a 500. */
export function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}
