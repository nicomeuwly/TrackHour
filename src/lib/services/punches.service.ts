import { db } from '@/lib/db';
import { parseTime, isValidPunchSequence, validateNewPunch, validatePunchEdit } from '@/lib/business/calculations';
import { AppError } from '@/lib/errors';
import type { Punch, DayEntry, LeaveType } from '@/lib/types';

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
  const existing = await db.entries.where('date').equals(date).first();

  if (punches.length === 0) {
    if (existing?.leaveType) {
      // Preserve leave-only entries
      await db.entries.update(existing.id, { punches: [], totalWorkedMinutes: 0, totalBreakMinutes: 0, updatedAt: new Date().toISOString() });
    } else {
      await db.entries.where('date').equals(date).delete();
    }
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

  if (existing) {
    await db.entries.update(existing.id, { punches, totalWorkedMinutes: workedMinutes, totalBreakMinutes: breakMinutes, updatedAt: now });
  } else {
    const entry: DayEntry = { id: crypto.randomUUID(), date, punches, totalWorkedMinutes: workedMinutes, totalBreakMinutes: breakMinutes, leaveType: null, note: '', updatedAt: now };
    await db.entries.add(entry);
  }
}

export async function setLeaveType(date: string, leaveType: LeaveType | null): Promise<void> {
  const existing = await db.entries.where('date').equals(date).first();
  const now = new Date().toISOString();
  if (existing) {
    if (leaveType === null && existing.punches.length === 0) {
      // Nothing left to keep on this day
      await db.entries.where('date').equals(date).delete();
    } else {
      await db.entries.update(existing.id, { leaveType, updatedAt: now });
    }
  } else if (leaveType !== null) {
    const entry: DayEntry = { id: crypto.randomUUID(), date, punches: [], totalWorkedMinutes: 0, totalBreakMinutes: 0, leaveType, note: '', updatedAt: now };
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

  const violation = validateNewPunch(last, type, punchTime, isManual);
  if (violation) throw violation;

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

export async function updatePunch(id: string, newTime: string): Promise<void> {
  const punch = await db.punches.get(id);
  if (!punch) return;

  const allPunches = await getPunchesByDate(punch.date);
  const idx = allPunches.findIndex(p => p.id === id);
  const prev = allPunches[idx - 1];
  const next = allPunches[idx + 1];

  const violation = validatePunchEdit(prev, next, newTime);
  if (violation) throw violation;

  await db.punches.update(id, { time: newTime, isManual: true });
  await updateDayEntry(punch.date);
}

/** Deletes punches and returns them, so the caller can offer an undo. */
export async function deletePunches(ids: string[]): Promise<Punch[]> {
  const punches = (await db.punches.bulkGet(ids)).filter((p): p is Punch => p !== undefined);
  if (punches.length === 0) return [];
  await db.punches.bulkDelete(punches.map(p => p.id));
  for (const date of new Set(punches.map(p => p.date))) {
    await updateDayEntry(date);
  }
  return punches;
}

/** Re-inserts previously deleted punches. Refuses if punches added in the meantime
 *  would make the day's sequence invalid (e.g. two clock-ins in a row). */
export async function restorePunches(punches: Punch[]): Promise<void> {
  for (const date of new Set(punches.map(p => p.date))) {
    const restored = punches.filter(p => p.date === date);
    const existing = await getPunchesByDate(date);
    if (!isValidPunchSequence([...existing, ...restored])) {
      throw new AppError('undoConflict');
    }
    await db.punches.bulkAdd(restored);
    await updateDayEntry(date);
  }
}

export async function updateEntryNote(date: string, note: string): Promise<void> {
  const existing = await db.entries.where('date').equals(date).first();
  if (existing) {
    await db.entries.update(existing.id, { note, updatedAt: new Date().toISOString() });
  }
}
