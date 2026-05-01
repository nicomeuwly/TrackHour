import { db } from '@/lib/db';
import { getAllEntries } from '@/lib/services/entries.service';
import { getPunchesByRange } from '@/lib/services/punches.service';
import { getSettings, updateSettings } from '@/lib/services/settings.service';
import type { Punch, DayEntry, Settings } from '@/lib/types';

interface BackupV2 {
  version: 2;
  exportedAt: string;
  punches: Punch[];
  entries: DayEntry[];
  settings: Settings;
}

export interface ImportResult {
  success: boolean;
  entriesImported: number;
  errors: string[];
}

export async function exportData(): Promise<string> {
  const [entries, settings] = await Promise.all([getAllEntries(), getSettings()]);
  const punches = entries.length > 0
    ? await getPunchesByRange(entries[entries.length - 1].date, entries[0].date)
    : [];

  const data: BackupV2 = { version: 2, exportedAt: new Date().toISOString(), punches, entries, settings };
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trackhour-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return json;
}

export async function importData(file: File): Promise<ImportResult> {
  const errors: string[] = [];
  let entriesImported = 0;

  let raw: string;
  try { raw = await file.text(); }
  catch { return { success: false, entriesImported: 0, errors: ['Failed to read file.'] }; }

  let data: unknown;
  try { data = JSON.parse(raw); }
  catch { return { success: false, entriesImported: 0, errors: ['Invalid JSON format.'] }; }

  const d = data as BackupV2;
  if (!d || d.version !== 2 || !Array.isArray(d.punches) || !Array.isArray(d.entries)) {
    return { success: false, entriesImported: 0, errors: ['Unsupported backup format. Only v2 backups are supported.'] };
  }

  try {
    await db.punches.bulkPut(d.punches);
    await db.entries.bulkPut(d.entries);
    entriesImported = d.entries.length;
  } catch (e) {
    errors.push(`Import failed: ${String(e)}`);
  }

  try { await updateSettings(d.settings); }
  catch (e) { errors.push(`Settings import failed: ${String(e)}`); }

  return { success: errors.length === 0, entriesImported, errors };
}
