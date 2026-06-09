import localforage from 'localforage';
import { computeOverall, RATING_FACETS } from '../components/RatingInput';

const store = localforage.createInstance({
  name: 'aftertaste',
  storeName: 'dish_logs',
});

// Bring any stored log up to the current shape. Older logs have a single
// `rating` (1-10) and no facets; expose it as `overall` so summaries render
// without NaN. Newer logs already carry facets + overall.
export const normalizeLog = (log) => {
  if (!log) return log;
  const hasFacets = RATING_FACETS.some((f) => log[f.key] != null);
  const overall = log.overall ?? (hasFacets ? computeOverall(log) : log.rating ?? null);
  return { ...log, overall };
};

export const saveDishLog = async (log) => {
  const existing = await getDishLogs();
  const overall = computeOverall(log) ?? log.rating ?? null;
  const newLog = {
    ...log,
    overall,
    id: Date.now().toString(),
    date: new Date().toISOString(),
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  };
  const updated = [newLog, ...existing];
  await store.setItem('logs', updated);
  return newLog;
};

export const getDishLogs = async () => {
  const data = await store.getItem('logs');
  return (data || []).map(normalizeLog);
};

export const deleteLog = async (logId) => {
  const logs = await store.getItem('logs');
  const filtered = (logs || []).filter((log) => log.id !== logId);
  await store.setItem('logs', filtered);
};
