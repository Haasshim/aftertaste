// Unified data API for dish logs. Uses Supabase (Postgres + Storage, RLS-scoped)
// when configured; otherwise falls back to local LocalForage storage so the app
// still runs before a backend is provisioned. All calls go through timeout +
// retry + typed-error wrappers so the UI can show real messages.
import { supabase, isSupabaseConfigured } from './supabase';
import * as local from '../utils/storage';
import { computeOverall } from '../components/RatingInput';
import { AppError, ErrorTypes, toAppError } from './errors';

const BUCKET = 'attachments';

// ---- resilience helpers -----------------------------------------------------
export function withTimeout(promise, ms = 10000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new AppError(ErrorTypes.NETWORK, 'The request timed out. Please try again.', { retryable: true })), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export async function withRetry(fn, { retries = 2, baseDelayMs = 300 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const err = toAppError(e);
      lastErr = err;
      if (!err.retryable || attempt === retries) throw err;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ---- mapping -----------------------------------------------------------------
function rowToLog(row, attachments = []) {
  const photos = attachments.filter((a) => a.kind === 'photo').map((a) => ({ name: a.file_name, data: a.signedUrl }));
  const voiceClips = attachments.filter((a) => a.kind === 'voice').map((a) => ({ data: a.signedUrl, duration: a.duration_sec }));
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    dishId: row.dish_id,
    dishName: row.dish_name,
    dishCategory: row.dish_category,
    taste: row.rating_taste,
    ambience: row.rating_ambience,
    service: row.rating_service,
    overall: row.rating_overall != null ? Math.round(Number(row.rating_overall)) : row.rating_legacy ?? null,
    comment: row.comment,
    stamps: row.stamps || [],
    links: row.links || [],
    photos,
    voiceClips,
    date: row.logged_at,
    day: new Date(row.logged_at).toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new AppError(ErrorTypes.AUTH, 'Your session expired. Please sign in again.');
  return data.user.id;
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

function extFromMime(mime) {
  if (!mime) return 'bin';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return mime.split('/')[1] || 'bin';
}

// ---- public API --------------------------------------------------------------
export async function getDishLogs() {
  if (!isSupabaseConfigured) return local.getDishLogs();

  return withRetry(() =>
    withTimeout(
      (async () => {
        const { data: rows, error } = await supabase
          .from('dish_logs')
          .select('*')
          .order('logged_at', { ascending: false });
        if (error) throw error;

        // Load attachments for all logs and sign their URLs (bucket is private).
        const ids = rows.map((r) => r.id);
        let attByLog = {};
        if (ids.length) {
          const { data: atts } = await supabase.from('attachments').select('*').in('dish_log_id', ids);
          for (const a of atts || []) {
            const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(a.storage_path, 3600);
            (attByLog[a.dish_log_id] ||= []).push({ ...a, signedUrl: signed?.signedUrl });
          }
        }
        return rows.map((r) => rowToLog(r, attByLog[r.id] || []));
      })()
    )
  );
}

export async function saveDishLog(log) {
  if (!isSupabaseConfigured) return local.saveDishLog(log);

  return withRetry(() =>
    withTimeout(
      (async () => {
        const userId = await currentUserId();
        const overall = computeOverall(log) ?? log.rating ?? null;

        const { data: inserted, error } = await supabase
          .from('dish_logs')
          .insert({
            user_id: userId,
            restaurant_id: log.restaurantId,
            restaurant_name: log.restaurantName,
            dish_id: log.dishId,
            dish_name: log.dishName,
            dish_category: log.dishCategory,
            source: log.source || 'manual',
            rating_taste: log.taste ?? null,
            rating_ambience: log.ambience ?? null,
            rating_service: log.service ?? null,
            comment: log.comment || null,
            stamps: log.stamps || [],
            links: log.links || [],
            logged_at: log.date || new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;

        const logId = inserted.id;
        const uploads = [];

        for (const photo of log.photos || []) {
          const blob = await dataUrlToBlob(photo.data);
          const path = `${userId}/${logId}/${crypto.randomUUID()}.${extFromMime(blob.type || 'image/jpeg')}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
          if (upErr) throw upErr;
          uploads.push({ dish_log_id: logId, user_id: userId, kind: 'photo', storage_path: path, file_name: photo.name, mime_type: blob.type, size_bytes: blob.size });
        }
        for (const clip of log.voiceClips || []) {
          const blob = await dataUrlToBlob(clip.data);
          const path = `${userId}/${logId}/${crypto.randomUUID()}.${extFromMime(blob.type || 'audio/webm')}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
          if (upErr) throw upErr;
          uploads.push({ dish_log_id: logId, user_id: userId, kind: 'voice', storage_path: path, mime_type: blob.type, duration_sec: clip.duration, size_bytes: blob.size });
        }
        if (uploads.length) {
          const { error: attErr } = await supabase.from('attachments').insert(uploads);
          if (attErr) throw attErr;
        }
        return { id: logId, overall };
      })()
    )
  );
}

// Distinct dish names this user has previously logged at a given restaurant,
// most-recent first. Powers the "your dishes here" quick-pick chips so a user
// building a journal at the same place doesn't retype dish names.
export async function getLoggedDishNames(restaurantId) {
  if (!restaurantId) return [];

  if (!isSupabaseConfigured) {
    const logs = await local.getDishLogs();
    return [...new Set(
      logs.filter((l) => l.restaurantId === restaurantId && l.dishName).map((l) => l.dishName)
    )];
  }

  try {
    return await withTimeout(
      (async () => {
        const { data, error } = await supabase
          .from('dish_logs')
          .select('dish_name, logged_at')
          .eq('restaurant_id', restaurantId)
          .order('logged_at', { ascending: false });
        if (error) throw error;
        const seen = new Set();
        const names = [];
        for (const row of data || []) {
          if (row.dish_name && !seen.has(row.dish_name)) {
            seen.add(row.dish_name);
            names.push(row.dish_name);
          }
        }
        return names;
      })(),
      8000
    );
  } catch {
    return [];
  }
}

export async function deleteLog(logId) {
  if (!isSupabaseConfigured) return local.deleteLog(logId);

  return withRetry(() =>
    withTimeout(
      (async () => {
        const userId = await currentUserId();
        // Remove stored files first (storage isn't cascade-deleted by the FK).
        const { data: atts } = await supabase.from('attachments').select('storage_path').eq('dish_log_id', logId);
        const paths = (atts || []).map((a) => a.storage_path);
        if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
        // Deleting the row cascades the attachments metadata rows.
        const { error } = await supabase.from('dish_logs').delete().eq('id', logId).eq('user_id', userId);
        if (error) throw error;
      })()
    )
  );
}
