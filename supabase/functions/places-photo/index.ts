// Google Places photo proxy (READ-ONLY, image bytes).
//
// An <img> tag cannot send an Authorization header, so this function is
// deployed WITHOUT the platform JWT gate and instead validates a short-lived
// user access token passed as the `token` query param. It then fetches the
// photo media from Google server-side — the GOOGLE_PLACES_API_KEY never
// reaches the browser — and streams the image back.
//
// Deploy (note the flag — required so <img> requests aren't blocked):
//   supabase functions deploy places-photo --no-verify-jwt
// Secret (shared with places-search):
//   supabase secrets set GOOGLE_PLACES_API_KEY=...
//
// URL shape the frontend builds:
//   {SUPABASE_URL}/functions/v1/places-photo?name=places/AAA/photos/BBB&token=<jwt>&w=400

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  if (!GOOGLE_API_KEY) return new Response("Not configured", { status: 503 });

  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const width = Math.min(Number(url.searchParams.get("w")) || 400, 1200);

  // The resource name must be a Places photo reference — reject anything else
  // so this can't be turned into an open proxy.
  if (!/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
    return new Response("Bad photo reference", { status: 400 });
  }
  if (!token) return new Response("Missing token", { status: 401 });

  // Validate the caller's Supabase session before doing billable work.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return new Response("Invalid session", { status: 401 });

  try {
    const mediaUrl =
      `https://places.googleapis.com/v1/${name}/media` +
      `?maxWidthPx=${width}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(mediaUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return new Response("Upstream error", { status: 502 });

    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
        // Let the browser cache the image; the photo bytes are stable.
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Photo request failed", { status: 502 });
  }
});
