import { db, DEFAULT_SETTINGS } from '@/lib/db';
import type { Settings } from '@/lib/types';

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get('user-settings');
  if (existing) return existing;

  const defaults: Settings = {
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
  };
  await db.settings.add(defaults);
  return defaults;
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated: Settings = {
    ...current,
    ...data,
    id: 'user-settings',
    updatedAt: new Date().toISOString(),
  };
  await db.settings.put(updated);
  return updated;
}
