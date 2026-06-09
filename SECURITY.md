# Aftertaste — Security Model

Aftertaste uses **Supabase** for authentication, database, and file storage. Security is
enforced by the database (Row-Level Security), not by client code. This document explains the
model and the operational practices that keep it safe.

> The single most important rule: **secrets and trust never live in the browser.** Any
> `VITE_`-prefixed env var is bundled into the public JavaScript and readable by anyone in dev
> tools. Only the Supabase URL + anon key may be public — and only because RLS gates them.

---

## 1. Authentication

- Supabase Auth (email/password) issues a short-lived JWT access token + auto-refreshed
  refresh token, managed by `@supabase/supabase-js` (`src/lib/supabase.js`,
  `src/context/AuthContext.jsx`).
- Password hashing, token issuance, and TLS are handled by Supabase — we do not roll our own.
- The app has **no hardcoded credentials**. The old `test@aftertaste.com / taste123` login was
  removed.

## 2. Row-Level Security (RLS) — the real privacy boundary

Every request to Postgres runs as role `authenticated` with `auth.uid()` bound to the caller's
JWT. With RLS **enabled and forced** (`supabase/migrations/0002_rls.sql`), the database only
returns or accepts rows a policy permits:

- `dish_logs`, `profiles`, `attachments`: `select/insert/update/delete` all require
  `auth.uid() = user_id`. A query for "all logs" silently returns only the caller's rows.
- **Ownership on write:** `insert ... with check (auth.uid() = user_id)` rejects any request
  that tries to stamp another user's id.
- **No self-promotion:** the `profiles` update policy pins `role` to its current value, so a
  user cannot make themselves an admin.
- **Storage:** the `attachments` bucket is private; files are stored under `{user_id}/...` and
  policies match the first path segment to `auth.uid()`. User B cannot read or sign URLs for
  user A's files.

This directly answers the "can user B see user A's data?" test: **no** — it's enforced in the
database, not in bypassable app code. Client-side route guards (`ProtectedRoute`) are UX only.

## 3. Where each secret lives

| Secret | Public? | Location |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | `.env` → frontend bundle |
| `VITE_SUPABASE_ANON_KEY` | Public (RLS-gated) | `.env` → frontend bundle |
| Supabase `service_role` key | **Secret** (bypasses RLS) | Edge Function / CI only |
| `GOOGLE_PLACES_API_KEY` | **Secret** (billable) | Edge Function secret only |

Restaurant discovery goes through the **`places-search` Edge Function**
(`supabase/functions/places-search/`), which holds the Google API key, verifies the caller's
JWT before doing billable work, whitelists actions (`search` / `details`), and never returns
the key to the client (place photos are omitted for exactly this reason). The key is **never**
a `VITE_` variable.

## 4. Network & error handling

`src/lib/dataClient.js` wraps all data calls with timeouts, bounded retries (network/5xx/429
only), and a typed error model (`src/lib/errors.js`). The UI shows real messages + retry
(`ErrorState`, `OfflineBanner`, `ErrorBoundary`) instead of white screens or infinite spinners
when the connection drops.

## 5. Secret rotation checklist

1. **Suspected leak / pasted into an AI chat or shared transcript** → revoke and rotate the key
   immediately, then scan history (`git log -S 'sk-ant'`, gitleaks) and purge if committed.
2. **anon key** → rotating invalidates sessions; redeploy the frontend.
3. **`service_role`** → rotate in dashboard → `supabase secrets set` → redeploy functions (no
   frontend rebuild, since it's never embedded).
4. **`GOOGLE_PLACES_API_KEY`** → regenerate in Google Cloud Console → `supabase secrets set` →
   redeploy → delete old key. Keep API + referrer restrictions on it.
5. **Cadence** → rotate service_role + Google key every ~90 days; track owner +
   last-rotated date.

## 6. Verifying the model yourself

- Create users A and B. Signed in as B, the journal shows none of A's logs; opening A's
  `#/dish/:id` URL shows no data.
- `npm run build`, then search `dist/` for `service_role` / `sb_secret` / `AIza` (Google key) →
  zero hits.
- Disconnect wifi mid-save → a real error with retry, not a hang.
