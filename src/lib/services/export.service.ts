import { db } from '@/lib/db';
import { getEntriesByRange, getAllEntries } from '@/lib/services/entries.service';
import { getSettings } from '@/lib/services/settings.service';
import { calculateBalance, formatMinutesAsDecimal } from '@/lib/business/calculations';

export async function exportPeriodAsCSV(startDate: string, endDate: string, label: string): Promise<void> {
  const [entries, settings] = await Promise.all([getEntriesByRange(startDate, endDate), getSettings()]);

  const headers = ['Date', 'Day', 'Worked (h)', 'Break (min)', 'Balance (h)', 'Note'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const rows = entries.map(e => {
    const balance = calculateBalance(e.totalWorkedMinutes, settings.expectedHoursPerDay);
    const dayName = dayNames[new Date(e.date + 'T00:00:00').getDay()];
    return [
      e.date,
      dayName,
      formatMinutesAsDecimal(e.totalWorkedMinutes),
      String(e.totalBreakMinutes),
      (balance / 60).toFixed(2),
      `"${(e.note ?? '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trackhour-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAllAsCSV(): Promise<void> {
  const entries = await getAllEntries();
  if (entries.length === 0) return;
  const first = entries[entries.length - 1].date;
  const last = entries[0].date;
  await exportPeriodAsCSV(first, last, 'all');
}

export async function deletePeriodData(startDate: string, endDate: string): Promise<number> {
  const entries = await getEntriesByRange(startDate, endDate);
  await db.punches.where('date').between(startDate, endDate, true, true).delete();
  await db.entries.where('date').between(startDate, endDate, true, true).delete();
  return entries.length;
}

export async function deleteAllData(): Promise<void> {
  await db.punches.clear();
  await db.entries.clear();
}
