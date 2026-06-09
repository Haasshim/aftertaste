// Restaurant discovery. When the Google Places integration is enabled (and
// Supabase is configured), this calls the places-search Edge Function — which
// holds the Google API key server-side. Otherwise (or on any failure) it falls
// back to the bundled static catalog so the app always works.
//
// Note: Places returns restaurants but NOT menus, so discovered restaurants
// have an empty `dishes` array — the UI lets you log a custom dish in that case.
import { supabase, isSupabaseConfigured } from './supabase';
import staticRestaurants from '../data/restaurants';
import { withRetry, withTimeout } from './dataClient';
import { toAppError } from './errors';

const PLACES_ENABLED = import.meta.env.VITE_ENABLE_PLACES === 'true' && isSupabaseConfigured;

// Static catalog ids are short numeric strings ('1'..'15'); Google place ids
// are long opaque tokens. Used to decide whether to hit the Places API.
function isStaticId(id) {
  return staticRestaurants.some((r) => r.id === id);
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// Build a proxied image URL for a Places photo reference. The image bytes are
// served by the places-photo Edge Function so the Google key stays server-side.
function photoUrl(photoName, token) {
  if (!photoName || !token) return null;
  return `${SUPABASE_URL}/functions/v1/places-photo?name=${encodeURIComponent(photoName)}&token=${token}&w=400`;
}

// Turn a restaurant's photoName into a displayable `image` URL.
function withImage(restaurant, token) {
  if (!restaurant) return restaurant;
  return { ...restaurant, image: photoUrl(restaurant.photoName, token) || restaurant.image };
}

async function callDiscovery(body, token) {
  if (!token) throw toAppError({ status: 401 });
  const { data, error } = await supabase.functions.invoke('places-search', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw error;
  if (!data?.ok) throw toAppError({ status: 502, message: data?.error?.message });
  return data;
}

function filterStatic(query) {
  const q = query.toLowerCase();
  return staticRestaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.cuisine.some((c) => c.toLowerCase().includes(q))
  );
}

// Returns { restaurants, source: 'places' | 'static' }.
// `location` is "lat,lng" (device GPS) or free text ("Chennai"); may be empty.
export async function searchRestaurants(query = '', location = '') {
  if (PLACES_ENABLED && query.trim()) {
    try {
      const token = await getToken();
      const data = await withRetry(() =>
        withTimeout(callDiscovery({ action: 'search', query, location, limit: 12 }, token), 16000)
      );
      if (data.restaurants?.length) {
        return { restaurants: data.restaurants.map((r) => withImage(r, token)), source: 'places' };
      }
    } catch {
      // fall through to static
    }
  }
  return { restaurants: filterStatic(query), source: 'static' };
}

// Returns a single restaurant (with dishes for static; empty dishes for Places).
export async function getRestaurant(id) {
  if (!id) return null;
  if (isStaticId(id)) return staticRestaurants.find((r) => r.id === id) || null;

  if (PLACES_ENABLED) {
    try {
      const token = await getToken();
      const data = await withRetry(() =>
        withTimeout(callDiscovery({ action: 'details', placeId: id }, token), 16000)
      );
      if (data.restaurant) return withImage(data.restaurant, token);
    } catch {
      // fall through
    }
  }
  return staticRestaurants.find((r) => r.id === id) || null;
}

export { PLACES_ENABLED };
