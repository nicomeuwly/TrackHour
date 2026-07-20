import { db, DEFAULT_SETTINGS } from '@/lib/db';
import type { Settings } from '@/lib/types';

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get('user-settings');
  // Merge defaults so records saved before a field existed (e.g. annualVacationDays) stay valid.
  if (existing) return { ...DEFAULT_SETTINGS, ...existing };

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
