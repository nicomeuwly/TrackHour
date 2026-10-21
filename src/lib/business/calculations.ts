import type { Punch, DayEntry, DayCalculation, Settings, WeekBalance, MonthBalance, DayStatus, LeaveType, CalendarDayStatus } from '@/lib/types';
import { AppError } from '@/lib/errors';

/** True when the leave tops the day up to expected hours (balance-neutral).
 *  `compensation` and no-leave return false. */
export function isFilledLeave(leaveType: LeaveType | null): boolean {
  return leaveType !== null && leaveType !== 'compensation';
}

/** True when the given date falls on one of the configured working days. */
export function isWorkday(date: string, workDays: number[]): boolean {
  const dow = new Date(date + 'T00:00:00').getDay();
  const isoDay = dow === 0 ? 7 : dow;
  return workDays.includes(isoDay);
}

/**
 * Balance contribution of a single day, used for weekly/monthly aggregation.
 * On a workday: worked + leave top-up - expected (compensation is not topped up,
 * so it yields a full-day deficit that draws down overtime). On a non-workday:
 * only worked minutes count as overtime; absences carry no expectation.
 */
export function dayBalanceMinutes(
  entry: DayEntry | undefined,
  settings: Settings,
  workday: boolean,
): number {
  const expected = settings.expectedHoursPerDay * 60;
  const worked = entry?.totalWorkedMinutes ?? 0;
  if (!workday) return worked;
  const fill = isFilledLeave(entry?.leaveType ?? null) ? Math.max(0, expected - worked) : 0;
  return worked + fill - expected;
}

/**
 * Whether a day should count toward an aggregate (week/month/year) balance.
 * Past days always count. The current day counts only once it is settled:
 * its expected hours are met, or it is marked as leave. This keeps a day still
 * in progress from showing up as a deficit before it is finished.
 */
export function countsTowardBalance(entry: DayEntry, settings: Settings, today: string): boolean {
  if (entry.date !== today) return true;
  if (entry.leaveType !== null) return true;
  return entry.totalWorkedMinutes >= settings.expectedHoursPerDay * 60;
}

/**
 * Status shown for a day in the week list and month calendar.
 * `firstTrackedDate` is the earliest logged day (null if none): unlogged days before
 * it are `untracked`, not `missing`, so a new user isn't greeted with a wall of red.
 * Today stays `inProgress` until it is complete, mirroring countsTowardBalance.
 */
export function getCalendarDayStatus(
  date: string,
  entry: DayEntry | undefined,
  settings: Settings,
  today: string,
  firstTrackedDate: string | null,
): CalendarDayStatus {
  if (!isWorkday(date, settings.workDays)) return 'weekend';
  if (entry?.leaveType) return entry.leaveType;
  if (date > today) return 'future';
  if (entry && entry.totalWorkedMinutes >= settings.expectedHoursPerDay * 60) return 'complete';
  if (date === today) return 'inProgress';
  if (!entry) return firstTrackedDate !== null && date >= firstTrackedDate ? 'missing' : 'untracked';
  return 'incomplete';
}

/** Balance shown on a single day row: the day's contribution to the aggregate balance,
 *  or null when the day doesn't count toward it (unlogged, or today still in progress). */
export function dayRowBalance(
  date: string,
  entry: DayEntry | undefined,
  settings: Settings,
  today: string,
): number | null {
  if (!entry || !countsTowardBalance(entry, settings, today)) return null;
  return dayBalanceMinutes(entry, settings, isWorkday(date, settings.workDays));
}

/** True when punches, in chronological order, alternate in/out starting with a
 *  clock-in, with strictly increasing times. Guards restoring deleted punches. */
export function isValidPunchSequence(punches: Punch[]): boolean {
  const sorted = [...punches].sort((a, b) => a.time.localeCompare(b.time));
  return sorted.every((punch, i) => {
    const expectedType = i % 2 === 0 ? 'in' : 'out';
    const prev = sorted[i - 1];
    return punch.type === expectedType && (!prev || prev.time < punch.time);
  });
}

/** Rule for adding a punch after `last` (the day's latest punch). Returns the
 *  violation, or null when the punch is allowed. Times are "HH:mm". */
export function validateNewPunch(
  last: Punch | undefined,
  type: 'in' | 'out',
  time: string,
  isManual: boolean,
): AppError | null {
  if (last && last.type === type) return new AppError(type === 'in' ? 'alreadyClockedIn' : 'alreadyClockedOut');
  if (!last && type === 'out') return new AppError('clockOutBeforeIn');
  if (last && isManual && time <= last.time) return new AppError('timeMustBeAfter', { time: last.time });
  return null;
}

/** Rule for moving a punch to `newTime`: it must stay strictly between its neighbours. */
export function validatePunchEdit(
  prev: Punch | undefined,
  next: Punch | undefined,
  newTime: string,
): AppError | null {
  if (prev && newTime <= prev.time) return new AppError('timeMustBeAfter', { time: prev.time });
  if (next && newTime >= next.time) return new AppError('timeMustBeBefore', { time: next.time });
  return null;
}

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

const MS_PER_MINUTE = 60_000;

/** Milliseconds until the next wall-clock minute, so live timers tick in sync with the clock. */
export function msUntilNextMinute(now: Date): number {
  return MS_PER_MINUTE - (now.getSeconds() * 1000 + now.getMilliseconds());
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

/** Counts the working days (per `workDays`) in the inclusive date range. */
export function countExpectedDays(startDate: string, endDate: string, workDays: number[]): number {
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

/** Aggregates DayEntries into a WeekBalance using cached totalWorkedMinutes.
 *  Pass periodStart/periodEnd to count expected days over the full period. */
export function calculateWeekBalance(entries: DayEntry[], settings: Settings, periodStart?: string, periodEnd?: string, today?: string): WeekBalance {
  const expectedPerDay = settings.expectedHoursPerDay * 60;
  let daysExpected: number;
  if (periodStart && periodEnd) {
    daysExpected = countExpectedDays(periodStart, periodEnd, settings.workDays);
  } else if (entries.length === 0) {
    return { totalWorkedMinutes: 0, totalExpectedMinutes: 0, balanceMinutes: 0, daysLogged: 0, daysExpected: 0 };
  } else {
    const dates = entries.map(e => e.date).sort();
    daysExpected = countExpectedDays(dates[0], dates[dates.length - 1], settings.workDays);
  }
  const totalExpectedMinutes = daysExpected * expectedPerDay;
  const totalWorkedMinutes = entries.reduce((sum, e) => sum + e.totalWorkedMinutes, 0);
  // Overtime balance counts only days that have been logged: unlogged workdays are
  // hours still to do, not a deficit against accumulated overtime. The current day
  // is excluded until it is finished (see countsTowardBalance).
  const balanceMinutes = entries.reduce((sum, e) => {
    if (today && !countsTowardBalance(e, settings, today)) return sum;
    return sum + dayBalanceMinutes(e, settings, isWorkday(e.date, settings.workDays));
  }, 0);
  return {
    totalWorkedMinutes,
    totalExpectedMinutes,
    balanceMinutes,
    daysLogged: entries.length,
    daysExpected,
  };
}

/** Aggregates DayEntries into a MonthBalance. */
export function calculateMonthBalance(entries: DayEntry[], settings: Settings, periodStart?: string, periodEnd?: string, today?: string): MonthBalance {
  const week = calculateWeekBalance(entries, settings, periodStart, periodEnd, today);
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
  leaveType: LeaveType | null = null,
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

  const effectiveFill = isFilledLeave(leaveType)
    ? Math.max(0, expectedMinutes - workedMinutes)
    : 0;

  let projectedEndTime: string | null = null;
  if (leaveType === null && lastPunch !== null && isToday && (lastPunchType === 'in' || workedMinutes < expectedMinutes)) {
    // When clocked in: anchor to now (nowMins and workedMinutes grow together → result is stable)
    // When on break: anchor to last clock-out time (workedMinutes is frozen → result stays fixed)
    const baseMins = lastPunchType === 'in' ? nowMins : parseTime(lastPunch.time);
    const breakDeficit = Math.max(0, settings.minimumBreakMinutes - breakMinutes);
    const projectedMins = baseMins + (expectedMinutes - workedMinutes) + breakDeficit;
    const h = Math.floor(((projectedMins % 1440) + 1440) % 1440 / 60);
    const m = Math.round(((projectedMins % 1440) + 1440) % 1440 % 60);
    projectedEndTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const dow = new Date(entryDate + 'T00:00:00').getDay();
  const isoDay = dow === 0 ? 7 : dow;
  let status: DayStatus;
  if (!settings.workDays.includes(isoDay)) {
    status = 'weekend';
  } else if (leaveType !== null) {
    status = leaveType;
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
    balanceMinutes: Math.round(workedMinutes + effectiveFill - expectedMinutes),
    leaveType,
    status,
    lastPunchType,
  };
}

