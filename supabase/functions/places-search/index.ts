// Google Places discovery proxy (READ-ONLY).
//
// Holds GOOGLE_PLACES_API_KEY as an Edge Function secret so the key never
// reaches the browser. Verifies the caller's Supabase JWT before doing any
// (billable) work, then proxies three read-only operations:
//   action: "search"  -> text search (optionally biased to a location)
//   action: "details" -> place details for one place id
//
// Location may be passed as "lat,lng" (from device GPS) or as free text
// ("Chennai", "T. Nagar") which we geocode first.
//
// Photos are intentionally NOT returned: the Places photo-media endpoint needs
// the API key in the URL, which would leak it to the client. The app shows a
// neutral placeholder instead.
//
// Deploy:  supabase functions deploy places-search
// Secret:  supabase secrets set GOOGLE_PLACES_API_KEY=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_ACTIONS = ["search", "details"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

// Pull a short locality/area out of address components or the formatted string.
function shortLocality(place: any): string {
  const comps = place.addressComponents ?? [];
  const pick = (type: string) =>
    comps.find((c: any) => (c.types ?? []).includes(type))?.shortText ||
    comps.find((c: any) => (c.types ?? []).includes(type))?.longText;
  const locality =
    pick("sublocality_level_1") || pick("sublocality") || pick("locality") || pick("administrative_area_level_2");
  if (locality) return locality;
  const fa: string = place.formattedAddress ?? "";
  const parts = fa.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? "";
}

// Map Google place types like "indian_restaurant" into readable cuisine labels.
function cuisineFromTypes(types: string[] = []): string[] {
  const out: string[] = [];
  for (const t of types) {
    if (t.endsWith("_restaurant")) {
      const base = t.replace(/_restaurant$/, "").replace(/_/g, " ");
      out.push(base.replace(/\b\w/g, (m) => m.toUpperCase()));
    } else if (t === "cafe") out.push("Cafe");
    else if (t === "bakery") out.push("Bakery");
    else if (t === "bar") out.push("Bar");
  }
  return [...new Set(out)];
}

function normalizePlace(place: any) {
  return {
    id: place.id,
    name: place.displayName?.text ?? "Unknown",
    address: place.formattedAddress ?? "",
    location: shortLocality(place),
    cuisine: cuisineFromTypes(place.types),
    // Photo *resource name* only (e.g. "places/XXX/photos/YYY"). The actual
    // image bytes are fetched through the places-photo proxy so the API key
    // never reaches the client. The frontend builds the proxied URL.
    photoName: place.photos?.[0]?.name ?? null,
    dishes: [],
  };
}

const LATLNG_RE = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;

// Resolve a free-text location to coordinates via the Geocoding API.
async function geocode(location: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  return loc ? { latitude: loc.lat, longitude: loc.lng } : null;
}

async function resolveCenter(location: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!location) return null;
  if (LATLNG_RE.test(location)) {
    const [lat, lng] = location.split(",").map((s) => parseFloat(s.trim()));
    return { latitude: lat, longitude: lng };
  }
  return geocode(location);
}

const SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.types,places.addressComponents,places.photos";
const DETAILS_FIELD_MASK =
  "id,displayName,formattedAddress,types,addressComponents,photos";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: { message: "Method not allowed" } }, 405, origin);
  if (!GOOGLE_API_KEY) return json({ ok: false, error: { message: "Discovery not configured" } }, 503, origin);

  // 1) Verify the caller's Supabase JWT before any billable work.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ ok: false, error: { message: "Missing authorization" } }, 401, origin);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json({ ok: false, error: { message: "Invalid or expired session" } }, 401, origin);
  }

  // 2) Validate the request.
  let payload: { action?: string; query?: string; location?: string; placeId?: string; limit?: number };
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: { message: "Invalid JSON body" } }, 400, origin);
  }
  const action = payload.action as Action;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return json({ ok: false, error: { message: "Unsupported action" } }, 400, origin);
  }

  try {
    if (action === "details") {
      const placeId = (payload.placeId ?? "").trim();
      if (!placeId) return json({ ok: false, error: { message: "Missing placeId" } }, 400, origin);
      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": DETAILS_FIELD_MASK },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        return json({ ok: false, error: { message: "Discovery service unavailable" } }, res.status === 429 ? 429 : 502, origin);
      }
      const place = await res.json();
      return json({ ok: true, restaurant: normalizePlace(place) }, 200, origin);
    }

    // action === "search"
    const query = (payload.query ?? "").trim();
    if (!query) return json({ ok: true, restaurants: [] }, 200, origin);

    const center = await resolveCenter(payload.location ?? "");
    const body: Record<string, unknown> = {
      textQuery: query,
      includedType: "restaurant",
      maxResultCount: Math.min(payload.limit ?? 12, 20),
    };
    if (center) {
      body.locationBias = { circle: { center, radius: 10000 } };
    }

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return json({ ok: false, error: { message: "Discovery service unavailable" } }, res.status === 429 ? 429 : 502, origin);
    }
    const data = await res.json();
    const restaurants = (data.places ?? []).map(normalizePlace);
    return json({ ok: true, restaurants }, 200, origin);
  } catch (_e) {
    return json({ ok: false, error: { message: "Discovery request failed" } }, 502, origin);
  }
});
