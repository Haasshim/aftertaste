import { createClient } from '@supabase/supabase-js';

// Only the Supabase URL + anon key are exposed to the client. The anon key is
// safe in the bundle because Row-Level Security gates every query: it grants no
// access without a valid user session + matching policy. The service_role key
// and Google Places key NEVER ship here — they live in Edge Functions.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When env vars are absent (e.g. fresh checkout before provisioning) the app
// falls back to a local-only mode instead of crashing. See AuthContext/dataClient.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
