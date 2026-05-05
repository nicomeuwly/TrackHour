import type { Punch, DayEntry, DayCalculation, Settings, WeekBalance, MonthBalance, DayStatus } from '@/lib/types';

/** Converts "HH:mm" to minutes since midnight. E.g. "09:30" → 570 */
export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Converts minutes to "hh:mm". E.g. 570 → "09:30" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Converts minutes to decimal hours string. E.g. 570 → "9.50" */
export function formatMinutesAsDecimal(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

/** Net worked minutes = (end - start) - break. Returns 0 if negative. */
export function calculateWorkedMinutes(
  startTime: string,
  endTime: string,
  breakDuration: number,
): number {
  const result = parseTime(endTime) - parseTime(startTime) - breakDuration;
  return Math.max(0, result);
}

/** Balance in minutes vs expected daily hours. Positive = overtime, negative = under. */
export function calculateBalance(workedMinutes: number, expectedHoursPerDay: number): number {
  return workedMinutes - expectedHoursPerDay * 60;
}

export function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the Monday and Sunday dates of the week containing the given date. */
export function getWeekDates(date: string): { start: string; end: string } {
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: localDateStr(monday), end: localDateStr(sunday) };
}

/** Returns the first and last date of the given month (1-12). */
export function getMonthDates(year: number, month: number): { start: string; end: string } {
  return {
    start: localDateStr(new Date(year, month - 1, 1)),
    end: localDateStr(new Date(year, month, 0)),
  };
}

function countExpectedDays(startDate: string, endDate: string, workDays: number[]): number {
  let count = 0;
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (current <= end) {
    const isoDay = current.getDay() === 0 ? 7 : current.getDay();
    if (workDays.includes(isoDay)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** Aggregates DayEntries into a WeekBalance using cached totalWorkedMinutes. */
export function calculateWeekBalance(entries: DayEntry[], settings: Settings): WeekBalance {
  if (entries.length === 0) {
    return { totalWorkedMinutes: 0, totalExpectedMinutes: 0, balanceMinutes: 0, daysLogged: 0, daysExpected: 0 };
  }
  const dates = entries.map(e => e.date).sort();
  const daysExpected = countExpectedDays(dates[0], dates[dates.length - 1], settings.workDays);
  const totalExpectedMinutes = daysExpected * settings.expectedHoursPerDay * 60;
  const totalWorkedMinutes = entries.reduce((sum, e) => sum + e.totalWorkedMinutes, 0);
  return {
    totalWorkedMinutes,
    totalExpectedMinutes,
    balanceMinutes: totalWorkedMinutes - totalExpectedMinutes,
    daysLogged: entries.length,
    daysExpected,
  };
}

/** Aggregates DayEntries into a MonthBalance. */
export function calculateMonthBalance(entries: DayEntry[], settings: Settings): MonthBalance {
  const week = calculateWeekBalance(entries, settings);
  const averageHoursPerDay =
    week.daysLogged > 0 ? week.totalWorkedMinutes / week.daysLogged / 60 : 0;
  return { ...week, averageHoursPerDay };
}

/** Returns true if break meets the minimum requirement. */
export function isBreakSufficient(breakDuration: number, minimumBreakMinutes: number): boolean {
  return breakDuration >= minimumBreakMinutes;
}

/**
 * Computes real-time DayCalculation from an ordered list of punches.
 * Pass `now` explicitly for deterministic results (e.g. in tests).
 */
export function calculateFromPunches(
  punches: Punch[],
  settings: Settings,
  now: Date = new Date(),
  date?: string,
): DayCalculation {
  const sorted = [...punches].sort((a, b) => a.time.localeCompare(b.time));
  const entryDate = date ?? sorted[0]?.date ?? localDateStr(now);
  const todayStr = localDateStr(now);
  const isToday = entryDate === todayStr;

  const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  let workedMinutes = 0;
  let breakMinutes = 0;

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr.type === 'in') {
      if (next) {
        workedMinutes += parseTime(next.time) - parseTime(curr.time);
      } else if (isToday) {
        workedMinutes += Math.max(0, nowMins - parseTime(curr.time));
      }
    } else if (curr.type === 'out' && next?.type === 'in') {
      breakMinutes += parseTime(next.time) - parseTime(curr.time);
    }
  }

  const lastPunch = sorted[sorted.length - 1] ?? null;
  const lastPunchType = lastPunch?.type ?? null;
  const expectedMinutes = settings.expectedHoursPerDay * 60;

  let projectedEndTime: string | null = null;
  if (lastPunch !== null && isToday && (lastPunchType === 'in' || workedMinutes < expectedMinutes)) {
    // When clocked in: anchor to now (nowMins and workedMinutes grow together → result is stable)
    // When on break: anchor to last clock-out time (workedMinutes is frozen → result stays fixed)
    const baseMins = lastPunchType === 'in' ? nowMins : parseTime(lastPunch.time);
    const projectedMins = baseMins + (expectedMinutes - workedMinutes);
    const h = Math.floor(((projectedMins % 1440) + 1440) % 1440 / 60);
    const m = Math.round(((projectedMins % 1440) + 1440) % 1440 % 60);
    projectedEndTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const dow = new Date(entryDate + 'T00:00:00').getDay();
  const isoDay = dow === 0 ? 7 : dow;
  let status: DayStatus;
  if (!settings.workDays.includes(isoDay)) {
    status = 'weekend';
  } else if (sorted.length === 0) {
    status = entryDate < todayStr ? 'missing' : 'weekend';
  } else if (workedMinutes >= expectedMinutes) {
    status = 'complete';
  } else {
    status = 'incomplete';
  }

  const ongoingBreak = lastPunchType === 'out' && isToday
    ? Math.max(0, nowMins - parseTime(lastPunch!.time))
    : 0;

  return {
    workedMinutes: Math.round(workedMinutes),
    breakMinutes: Math.round(breakMinutes),
    liveBreakMinutes: Math.round(breakMinutes + ongoingBreak),
    isBreakSufficient: breakMinutes >= settings.minimumBreakMinutes,
    projectedEndTime,
    balanceMinutes: Math.round(workedMinutes - expectedMinutes),
    status,
    lastPunchType,
  };
}

