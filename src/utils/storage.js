import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'aftertaste',
  storeName: 'dish_logs',
});

export const saveDishLog = async (log) => {
  const existing = await getDishLogs();
  const newLog = {
    ...log,
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
  return data || [];
};

export const deleteLog = async (logId) => {
  const logs = await getDishLogs();
  const filtered = logs.filter((log) => log.id !== logId);
  await store.setItem('logs', filtered);
};
