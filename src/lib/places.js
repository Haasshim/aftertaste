// Restaurant discovery via Google Places only. All calls go through the
// places-search Edge Function, which holds the Google API key server-side.
// Places returns restaurants but NOT menus, so restaurants have an empty
// `dishes` array — the UI lets you log a custom dish name.
import { supabase, isSupabaseConfigured } from './supabase';
import { withRetry, withTimeout } from './dataClient';
import { toAppError } from './errors';

const PLACES_ENABLED = import.meta.env.VITE_ENABLE_PLACES === 'true' && isSupabaseConfigured;

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

// Returns { restaurants, source: 'places' }. Empty query -> empty results
// (the search screen shows a "start typing" prompt instead of a catalog).
// `location` is "lat,lng" (device GPS) or free text ("Chennai"); may be empty.
export async function searchRestaurants(query = '', location = '') {
  if (!PLACES_ENABLED || !query.trim()) {
    return { restaurants: [], source: 'places' };
  }
  const token = await getToken();
  const data = await withRetry(() =>
    withTimeout(callDiscovery({ action: 'search', query, location, limit: 12 }, token), 16000)
  );
  return {
    restaurants: (data.restaurants || []).map((r) => withImage(r, token)),
    source: 'places',
  };
}

// Returns a single restaurant by place id (empty dishes — Places has no menus).
export async function getRestaurant(id) {
  if (!id || !PLACES_ENABLED) return null;
  const token = await getToken();
  const data = await withRetry(() =>
    withTimeout(callDiscovery({ action: 'details', placeId: id }, token), 16000)
  );
  return data.restaurant ? withImage(data.restaurant, token) : null;
}

export { PLACES_ENABLED };
