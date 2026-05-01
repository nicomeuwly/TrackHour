import { db } from '@/lib/db';
import { parseTime } from '@/lib/business/calculations';
import type { Punch, DayEntry } from '@/lib/types';

export async function getPunchesByDate(date: string): Promise<Punch[]> {
  const punches = await db.punches.where('date').equals(date).toArray();
  return punches.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getPunchesByRange(startDate: string, endDate: string): Promise<Punch[]> {
  const punches = await db.punches.where('date').between(startDate, endDate, true, true).toArray();
  return punches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

async function updateDayEntry(date: string): Promise<void> {
  const punches = await getPunchesByDate(date);

  if (punches.length === 0) {
    await db.entries.where('date').equals(date).delete();
    return;
  }

  let workedMinutes = 0;
  let breakMinutes = 0;
  for (let i = 0; i < punches.length; i++) {
    const curr = punches[i];
    const next = punches[i + 1];
    if (curr.type === 'in' && next) {
      workedMinutes += parseTime(next.time) - parseTime(curr.time);
    } else if (curr.type === 'out' && next?.type === 'in') {
      breakMinutes += parseTime(next.time) - parseTime(curr.time);
    }
  }

  const now = new Date().toISOString();
  const existing = await db.entries.where('date').equals(date).first();

  if (existing) {
    await db.entries.update(existing.id, { punches, totalWorkedMinutes: workedMinutes, totalBreakMinutes: breakMinutes, updatedAt: now });
  } else {
    const entry: DayEntry = { id: crypto.randomUUID(), date, punches, totalWorkedMinutes: workedMinutes, totalBreakMinutes: breakMinutes, note: '', updatedAt: now };
    await db.entries.add(entry);
  }
}

export async function addPunch(
  date: string,
  type: 'in' | 'out',
  time?: string,
  isManual = false,
): Promise<Punch> {
  const existing = await getPunchesByDate(date);
  const last = existing[existing.length - 1];

  const now = new Date();
  const punchTime = time ?? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (last && last.type === type) {
    throw new Error(`Already clocked ${type}. Please clock ${type === 'in' ? 'out' : 'in'} first.`);
  }
  if (!last && type === 'out') {
    throw new Error('Cannot clock out without clocking in first.');
  }
  if (last && isManual && punchTime <= last.time) {
    throw new Error(`Time must be after ${last.time}.`);
  }

  const punch: Punch = {
    id: crypto.randomUUID(),
    date,
    time: punchTime,
    type,
    isManual,
    createdAt: new Date().toISOString(),
  };

  await db.punches.add(punch);
  await updateDayEntry(date);
  return punch;
}

export async function deletePunch(id: string): Promise<void> {
  const punch = await db.punches.get(id);
  if (!punch) return;
  await db.punches.delete(id);
  await updateDayEntry(punch.date);
}

export async function updateEntryNote(date: string, note: string): Promise<void> {
  const existing = await db.entries.where('date').equals(date).first();
  if (existing) {
    await db.entries.update(existing.id, { note, updatedAt: new Date().toISOString() });
  }
}
