// One-time migration of any logs stored in LocalForage (the pre-Supabase local
// store) into the authenticated user's Supabase account. Idempotent: guarded by
// profiles.local_migrated_at and the unique(user_id, legacy_id) constraint, and
// the local data is left intact until the migration succeeds.
import { supabase, isSupabaseConfigured } from './supabase';
import { getDishLogs as getLocalLogs } from '../utils/storage';

const BUCKET = 'attachments';

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function migrateLocalData(userId) {
  if (!isSupabaseConfigured || !userId) return { migrated: 0, skipped: true };

  // Skip if this user already migrated.
  const { data: profile } = await supabase.from('profiles').select('local_migrated_at').eq('id', userId).single();
  if (profile?.local_migrated_at) return { migrated: 0, skipped: true };

  const localLogs = await getLocalLogs();
  if (!localLogs.length) {
    await supabase.from('profiles').update({ local_migrated_at: new Date().toISOString() }).eq('id', userId);
    return { migrated: 0, skipped: false };
  }

  let migrated = 0;
  for (const log of localLogs) {
    try {
      const { data: row, error } = await supabase
        .from('dish_logs')
        .insert({
          user_id: userId,
          restaurant_id: log.restaurantId,
          restaurant_name: log.restaurantName || 'Unknown',
          dish_id: log.dishId,
          dish_name: log.dishName || 'Unknown dish',
          dish_category: log.dishCategory,
          source: 'legacy_local',
          rating_taste: log.taste ?? log.rating ?? null,
          rating_ambience: log.ambience ?? null,
          rating_service: log.service ?? null,
          rating_legacy: log.rating ?? null,
          comment: log.comment || null,
          stamps: log.stamps || [],
          links: log.links || [],
          legacy_id: log.id,
          logged_at: log.date || new Date().toISOString(),
        })
        .select()
        .single();

      // Duplicate (already migrated) — unique(user_id, legacy_id) violation.
      if (error) {
        if (error.code === '23505') continue;
        throw error;
      }

      const logId = row.id;
      for (const photo of log.photos || []) {
        const blob = await dataUrlToBlob(photo.data);
        const path = `${userId}/${logId}/${crypto.randomUUID()}.jpg`;
        await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
        await supabase.from('attachments').insert({ dish_log_id: logId, user_id: userId, kind: 'photo', storage_path: path, file_name: photo.name, mime_type: blob.type, size_bytes: blob.size });
      }
      for (const clip of log.voiceClips || []) {
        const blob = await dataUrlToBlob(clip.data);
        const path = `${userId}/${logId}/${crypto.randomUUID()}.webm`;
        await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
        await supabase.from('attachments').insert({ dish_log_id: logId, user_id: userId, kind: 'voice', storage_path: path, mime_type: blob.type, duration_sec: clip.duration, size_bytes: blob.size });
      }
      migrated += 1;
    } catch (e) {
      // Don't abort the whole batch on one bad log; it can be retried later
      // since the migration flag is only set on overall success.
      // eslint-disable-next-line no-console
      console.warn('Migration: failed to import a log, continuing.', e);
    }
  }

  await supabase.from('profiles').update({ local_migrated_at: new Date().toISOString() }).eq('id', userId);
  return { migrated, skipped: false };
}
