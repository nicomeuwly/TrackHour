import { db } from '@/lib/db';
import type { DayEntry } from '@/lib/types';

export async function getEntryByDate(date: string): Promise<DayEntry | undefined> {
  return db.entries.where('date').equals(date).first();
}

export async function getEntriesByRange(startDate: string, endDate: string): Promise<DayEntry[]> {
  return db.entries.where('date').between(startDate, endDate, true, true).toArray();
}

export async function getEntriesByMonth(year: number, month: number): Promise<DayEntry[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  return getEntriesByRange(start, end);
}

export async function getAllEntries(): Promise<DayEntry[]> {
  const entries = await db.entries.toArray();
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
