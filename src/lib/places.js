// Restaurant discovery via Google Places only. All calls go through the
// places-search Edge Function, which holds the Google API key server-side.
// Places returns restaurants but NOT menus, so restaurants have an empty
// `dishes` array — the UI lets you log a custom dish name.
import { supabase, isSupabaseConfigured } from './supabase';
import { withRetry, withTimeout } from './dataClient';
import { AppError, ErrorTypes, toAppError } from './errors';

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
  if (!token) {
    throw new AppError(ErrorTypes.AUTH, 'Please sign in again to search restaurants.', { retryable: false });
  }
  const { data, error } = await supabase.functions.invoke('places-search', {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    // functions.invoke reports any non-2xx as a generic "non-2xx status code"
    // error. Dig the real status/message out of the function's JSON response so
    // we can show something actionable instead of that raw string.
    let status = 502;
    try {
      if (error.context && typeof error.context.json === 'function') {
        status = error.context.status ?? status;
        const detail = await error.context.json();
        if (status === 401 || detail?.error?.message?.toLowerCase?.().includes('session')) {
          throw new AppError(ErrorTypes.AUTH, 'Your session expired. Sign out and back in, then search again.', { retryable: false });
        }
      }
    } catch (inner) {
      if (inner instanceof AppError) throw inner;
    }
    if (status === 401) {
      throw new AppError(ErrorTypes.AUTH, 'Your session expired. Sign out and back in, then search again.', { retryable: false });
    }
    throw new AppError(ErrorTypes.SERVER, 'Restaurant search is unavailable right now. Please try again in a moment.', { retryable: true, cause: error });
  }
  if (!data?.ok) {
    throw new AppError(ErrorTypes.SERVER, data?.error?.message || 'Restaurant search failed. Please try again.', { retryable: true });
  }
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
