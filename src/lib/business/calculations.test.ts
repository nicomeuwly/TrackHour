import { describe, it, expect } from 'vitest';
import {
  parseTime,
  formatMinutes,
  formatMinutesAsDecimal,
  calculateWorkedMinutes,
  calculateBalance,
  calculateWeekBalance,
  calculateMonthBalance,
  isBreakSufficient,
  getWeekDates,
  getMonthDates,
  calculateFromPunches,
  isFilledLeave,
  dayBalanceMinutes,
  absenceOvertimeMinutes,
  msUntilNextMinute,
  getCalendarDayStatus,
  dayRowBalance,
  isValidPunchSequence,
  validateNewPunch,
  validatePunchEdit,
} from './calculations';
import { AppError } from '@/lib/errors';
import type { DayEntry, Punch, Settings, LeaveType } from '@/lib/types';

const baseSettings: Settings = {
  id: 'user-settings',
  expectedHoursPerDay: 8,
  minimumBreakMinutes: 30,
  workDays: [1, 2, 3, 4, 5],
  annualVacationDays: 25,
  currency: '',
  locale: 'en',
  theme: 'light',
  updatedAt: '',
};

function makeDayEntry(date: string, totalWorkedMinutes: number, leaveType: LeaveType | null = null): DayEntry {
  return { id: date, date, punches: [], totalWorkedMinutes, totalBreakMinutes: 0, leaveType, note: '', updatedAt: '' };
}

function makePunch(date: string, time: string, type: 'in' | 'out'): Punch {
  return { id: `${date}-${time}-${type}`, date, time, type, isManual: false, createdAt: '' };
}

describe('parseTime', () => {
  it('parses midnight', () => expect(parseTime('00:00')).toBe(0));
  it('parses a normal time', () => expect(parseTime('09:30')).toBe(570));
  it('parses end of day', () => expect(parseTime('23:59')).toBe(1439));
});

describe('formatMinutes', () => {
  it('formats zero', () => expect(formatMinutes(0)).toBe('00:00'));
  it('formats 90 minutes', () => expect(formatMinutes(90)).toBe('01:30'));
  it('formats full hours', () => expect(formatMinutes(480)).toBe('08:00'));
  it('formats 570 minutes', () => expect(formatMinutes(570)).toBe('09:30'));
});


describe('formatMinutesAsDecimal', () => {
  it('formats 570', () => expect(formatMinutesAsDecimal(570)).toBe('9.50'));
  it('formats 450', () => expect(formatMinutesAsDecimal(450)).toBe('7.50'));
  it('formats 0', () => expect(formatMinutesAsDecimal(0)).toBe('0.00'));
});

describe('calculateWorkedMinutes', () => {
  it('calculates normal day', () => expect(calculateWorkedMinutes('09:00', '17:30', 30)).toBe(480));
  it('returns 0 for negative result', () => expect(calculateWorkedMinutes('09:00', '08:00', 0)).toBe(0));
  it('calculates with no break', () => expect(calculateWorkedMinutes('08:00', '16:00', 0)).toBe(480));
  it('returns 0 when break exceeds work time', () => expect(calculateWorkedMinutes('09:00', '09:30', 60)).toBe(0));
});

describe('calculateBalance', () => {
  it('returns 0 when exactly on target', () => expect(calculateBalance(480, 8)).toBe(0));
  it('returns positive for overtime', () => expect(calculateBalance(540, 8)).toBe(60));
  it('returns negative for under time', () => expect(calculateBalance(420, 8)).toBe(-60));
});

describe('isBreakSufficient', () => {
  it('returns true when break equals minimum', () => expect(isBreakSufficient(30, 30)).toBe(true));
  it('returns false when break is one minute short', () => expect(isBreakSufficient(29, 30)).toBe(false));
  it('returns true when break exceeds minimum', () => expect(isBreakSufficient(60, 30)).toBe(true));
});

describe('getWeekDates', () => {
  it('returns Monday to Sunday for a Wednesday', () => {
    const { start, end } = getWeekDates('2024-01-10');
    expect(start).toBe('2024-01-08');
    expect(end).toBe('2024-01-14');
  });
  it('handles a Monday input', () => {
    const { start, end } = getWeekDates('2024-01-08');
    expect(start).toBe('2024-01-08');
    expect(end).toBe('2024-01-14');
  });
  it('handles a Sunday input', () => {
    const { start } = getWeekDates('2024-01-14');
    expect(start).toBe('2024-01-08');
  });
});

describe('getMonthDates', () => {
  it('returns Jan 2024 bounds', () => {
    const { start, end } = getMonthDates(2024, 1);
    expect(start).toBe('2024-01-01');
    expect(end).toBe('2024-01-31');
  });
  it('handles February in a leap year', () => {
    expect(getMonthDates(2024, 2).end).toBe('2024-02-29');
  });
  it('handles February in a non-leap year', () => {
    expect(getMonthDates(2023, 2).end).toBe('2023-02-28');
  });
});

describe('calculateWeekBalance', () => {
  it('returns zeros for empty entries', () => {
    const r = calculateWeekBalance([], baseSettings);
    expect(r.totalWorkedMinutes).toBe(0);
    expect(r.daysLogged).toBe(0);
  });
  it('calculates a single day', () => {
    const r = calculateWeekBalance([makeDayEntry('2024-01-08', 480)], baseSettings);
    expect(r.totalWorkedMinutes).toBe(480);
    expect(r.daysLogged).toBe(1);
  });
  it('calculates balance for a full week', () => {
    const entries = ['2024-01-08','2024-01-09','2024-01-10','2024-01-11','2024-01-12']
      .map(d => makeDayEntry(d, 480));
    const r = calculateWeekBalance(entries, baseSettings);
    expect(r.totalWorkedMinutes).toBe(2400);
    expect(r.balanceMinutes).toBe(0);
    expect(r.daysExpected).toBe(5);
  });

  it('balance counts only logged days while expected covers the full period', () => {
    // Only Monday logged (10h worked) in a Mon–Fri period
    const r = calculateWeekBalance([makeDayEntry('2024-01-08', 600)], baseSettings, '2024-01-08', '2024-01-12');
    expect(r.totalWorkedMinutes).toBe(600);
    expect(r.totalExpectedMinutes).toBe(2400); // full week still to do
    expect(r.balanceMinutes).toBe(120);        // +2h overtime, not -30h
  });

  it('an under-worked logged day is a deficit, but unlogged days are not', () => {
    // One logged 6h day in a Mon–Fri period → -2h, not -34h
    const r = calculateWeekBalance([makeDayEntry('2024-01-08', 360)], baseSettings, '2024-01-08', '2024-01-12');
    expect(r.balanceMinutes).toBe(-120);
  });

  it('a vacation day is balance-neutral over the period', () => {
    // 4 worked days + 1 vacation day → expected 5 days, balance 0
    const entries = [
      ...['2024-01-08','2024-01-09','2024-01-10','2024-01-11'].map(d => makeDayEntry(d, 480)),
      makeDayEntry('2024-01-12', 0, 'vacation'),
    ];
    const r = calculateWeekBalance(entries, baseSettings, '2024-01-08', '2024-01-12');
    expect(r.balanceMinutes).toBe(0);
    expect(r.daysExpected).toBe(5);
  });

  it('sick and other leave are balance-neutral like vacation', () => {
    const sick = calculateWeekBalance([makeDayEntry('2024-01-08', 0, 'sick')], baseSettings, '2024-01-08', '2024-01-08');
    const other = calculateWeekBalance([makeDayEntry('2024-01-08', 0, 'other')], baseSettings, '2024-01-08', '2024-01-08');
    expect(sick.balanceMinutes).toBe(0);
    expect(other.balanceMinutes).toBe(0);
  });

  it('a compensation day draws down the overtime balance by a full day', () => {
    const r = calculateWeekBalance([makeDayEntry('2024-01-08', 0, 'compensation')], baseSettings, '2024-01-08', '2024-01-08');
    expect(r.balanceMinutes).toBe(-480);
  });

  it('time worked during a vacation day adds to the balance and is reported separately', () => {
    const entries = [
      ...['2024-01-08','2024-01-09','2024-01-10','2024-01-11'].map(d => makeDayEntry(d, 480)),
      makeDayEntry('2024-01-12', 120, 'vacation'),
    ];
    const r = calculateWeekBalance(entries, baseSettings, '2024-01-08', '2024-01-12');
    expect(r.balanceMinutes).toBe(120);
    expect(r.absenceOvertimeMinutes).toBe(120);
  });

  it('time worked on a compensation day reduces the deduction and is not absence overtime', () => {
    const r = calculateWeekBalance([makeDayEntry('2024-01-08', 180, 'compensation')], baseSettings, '2024-01-08', '2024-01-08');
    expect(r.balanceMinutes).toBe(-300);
    expect(r.absenceOvertimeMinutes).toBe(0);
  });

  it('absence overtime is zero for an empty period', () => {
    expect(calculateWeekBalance([], baseSettings).absenceOvertimeMinutes).toBe(0);
  });

  it('counts absence overtime of today live, since leave days always count', () => {
    const today = '2024-01-10';
    const r = calculateWeekBalance([makeDayEntry(today, 45, 'sick')], baseSettings, today, today, today);
    expect(r.balanceMinutes).toBe(45);
    expect(r.absenceOvertimeMinutes).toBe(45);
  });

  it('overtime accumulated over a week is spent by a compensation day', () => {
    // 4 days at 10h (=+8h overtime), then a compensation day → net 0
    const entries = [
      ...['2024-01-08','2024-01-09','2024-01-10','2024-01-11'].map(d => makeDayEntry(d, 600)),
      makeDayEntry('2024-01-12', 0, 'compensation'),
    ];
    const r = calculateWeekBalance(entries, baseSettings, '2024-01-08', '2024-01-12');
    expect(r.balanceMinutes).toBe(0);
  });
});

describe('isFilledLeave', () => {
  it('is true for vacation, sick and other', () => {
    expect(isFilledLeave('vacation')).toBe(true);
    expect(isFilledLeave('sick')).toBe(true);
    expect(isFilledLeave('other')).toBe(true);
  });
  it('is false for compensation and no leave', () => {
    expect(isFilledLeave('compensation')).toBe(false);
    expect(isFilledLeave(null)).toBe(false);
  });
});

describe('dayBalanceMinutes', () => {
  it('a missing workday is a full-day deficit', () => {
    expect(dayBalanceMinutes(undefined, baseSettings, true)).toBe(-480);
  });
  it('a filled leave day is neutral', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 0, 'vacation'), baseSettings, true)).toBe(0);
  });
  it('a compensation day is a full-day deficit', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 0, 'compensation'), baseSettings, true)).toBe(-480);
  });
  it('partial work on a compensation day only spends the remaining hours', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 180, 'compensation'), baseSettings, true)).toBe(-300);
  });
  it('work beyond expected on a compensation day becomes positive overtime', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 540, 'compensation'), baseSettings, true)).toBe(60);
  });
  it('work equal to expected on a compensation day cancels the deduction', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 480, 'compensation'), baseSettings, true)).toBe(0);
  });
  it('all time worked during a filled leave is overtime', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 120, 'vacation'), baseSettings, true)).toBe(120);
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 600, 'sick'), baseSettings, true)).toBe(600);
    expect(dayBalanceMinutes(makeDayEntry('2024-01-08', 60, 'other'), baseSettings, true)).toBe(60);
  });
  it('non-workdays only count worked overtime', () => {
    expect(dayBalanceMinutes(makeDayEntry('2024-01-06', 120, null), baseSettings, false)).toBe(120);
  });
});

describe('absenceOvertimeMinutes', () => {
  it('is the worked time on a filled leave day', () => {
    expect(absenceOvertimeMinutes(makeDayEntry('2024-01-08', 150, 'vacation'))).toBe(150);
    expect(absenceOvertimeMinutes(makeDayEntry('2024-01-08', 90, 'sick'))).toBe(90);
    expect(absenceOvertimeMinutes(makeDayEntry('2024-01-08', 30, 'other'))).toBe(30);
  });
  it('is zero for compensation, no leave, or a missing entry', () => {
    expect(absenceOvertimeMinutes(makeDayEntry('2024-01-08', 150, 'compensation'))).toBe(0);
    expect(absenceOvertimeMinutes(makeDayEntry('2024-01-08', 150, null))).toBe(0);
    expect(absenceOvertimeMinutes(undefined)).toBe(0);
  });
  it('on a non-workday leave entry, worked time is overtime either way (balance unchanged)', () => {
    const sat = makeDayEntry('2024-01-06', 90, 'vacation');
    expect(dayBalanceMinutes(sat, baseSettings, false)).toBe(90);
    expect(absenceOvertimeMinutes(sat)).toBe(90);
    const r = calculateWeekBalance([sat], baseSettings, '2024-01-01', '2024-01-07');
    expect(r.balanceMinutes).toBe(90);
    expect(r.absenceOvertimeMinutes).toBe(90);
  });
  it('is passed through by calculateMonthBalance', () => {
    const r = calculateMonthBalance([makeDayEntry('2024-01-08', 60, 'other')], baseSettings, '2024-01-01', '2024-01-31');
    expect(r.absenceOvertimeMinutes).toBe(60);
  });
  it('still counts leave overtime when today is an excluded in-progress regular day', () => {
    const today = '2024-01-10';
    const entries = [makeDayEntry('2024-01-08', 120, 'sick'), makeDayEntry(today, 200)];
    const r = calculateWeekBalance(entries, baseSettings, '2024-01-08', '2024-01-12', today);
    expect(r.balanceMinutes).toBe(120);
    expect(r.absenceOvertimeMinutes).toBe(120);
  });
});

describe('current-day exclusion from the aggregate balance', () => {
  const today = '2024-01-10'; // a Wednesday (workday)

  it('excludes the current day while it is in progress (worked < expected)', () => {
    const entries = [makeDayEntry('2024-01-08', 600), makeDayEntry(today, 180)];
    const r = calculateWeekBalance(entries, baseSettings, '2024-01-08', '2024-01-12', today);
    expect(r.balanceMinutes).toBe(120); // only Monday's +2h; today's -5h is ignored
  });

  it('includes the current day once expected hours are met', () => {
    const entries = [makeDayEntry('2024-01-08', 600), makeDayEntry(today, 540)];
    const r = calculateWeekBalance(entries, baseSettings, '2024-01-08', '2024-01-12', today);
    expect(r.balanceMinutes).toBe(180); // +2h Monday, +1h today
  });

  it('includes the current day when it is marked as leave', () => {
    const r = calculateWeekBalance([makeDayEntry(today, 0, 'compensation')], baseSettings, today, today, today);
    expect(r.balanceMinutes).toBe(-480);
  });

  it('counts every logged day when no today argument is given (backward compatible)', () => {
    const r = calculateWeekBalance([makeDayEntry(today, 180)], baseSettings, today, today);
    expect(r.balanceMinutes).toBe(-300);
  });

  it('still counts the day in totalWorked and daysLogged even while excluded from balance', () => {
    const r = calculateWeekBalance([makeDayEntry(today, 180)], baseSettings, today, today, today);
    expect(r.balanceMinutes).toBe(0);
    expect(r.totalWorkedMinutes).toBe(180);
    expect(r.daysLogged).toBe(1);
  });
});

describe('calculateMonthBalance', () => {
  it('returns averageHoursPerDay of 0 for empty entries', () => {
    expect(calculateMonthBalance([], baseSettings).averageHoursPerDay).toBe(0);
  });
  it('computes average correctly', () => {
    const entries = [makeDayEntry('2024-01-08', 480), makeDayEntry('2024-01-09', 480)];
    expect(calculateMonthBalance(entries, baseSettings).averageHoursPerDay).toBe(8);
  });
});

describe('calculateFromPunches', () => {
  const fixedNow = new Date('2024-01-08T14:30:00');

  it('returns zero for empty punches', () => {
    const r = calculateFromPunches([], baseSettings, fixedNow, '2024-01-08');
    expect(r.workedMinutes).toBe(0);
    expect(r.lastPunchType).toBeNull();
  });

  it('calculates a completed in/out pair', () => {
    const punches = [
      makePunch('2024-01-08', '09:00', 'in'),
      makePunch('2024-01-08', '17:00', 'out'),
    ];
    const r = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08');
    expect(r.workedMinutes).toBe(480);
    expect(r.breakMinutes).toBe(0);
    expect(r.lastPunchType).toBe('out');
    expect(r.status).toBe('complete');
  });

  it('accumulates multiple in/out pairs with break', () => {
    const punches = [
      makePunch('2024-01-08', '09:00', 'in'),
      makePunch('2024-01-08', '12:00', 'out'),
      makePunch('2024-01-08', '13:00', 'in'),
      makePunch('2024-01-08', '17:00', 'out'),
    ];
    const r = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08');
    expect(r.workedMinutes).toBe(420);
    expect(r.breakMinutes).toBe(60);
    expect(r.isBreakSufficient).toBe(true);
  });

  it('adds ongoing time when clocked in on today', () => {
    // now = 14:30, clocked in at 14:00 → 30 min ongoing
    const punches = [makePunch('2024-01-08', '14:00', 'in')];
    const r = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08');
    expect(r.workedMinutes).toBe(30);
    expect(r.lastPunchType).toBe('in');
    expect(r.projectedEndTime).not.toBeNull();
  });

  it('does not add ongoing time for past dates', () => {
    const punches = [makePunch('2024-01-07', '09:00', 'in')];
    const r = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-07');
    expect(r.workedMinutes).toBe(0);
  });

  it('marks weekend correctly', () => {
    // 2024-01-06 is Saturday
    const r = calculateFromPunches([], baseSettings, fixedNow, '2024-01-06');
    expect(r.status).toBe('weekend');
  });

  it('marks missing for past workday with no punches', () => {
    const r = calculateFromPunches([], baseSettings, fixedNow, '2024-01-05');
    expect(r.status).toBe('missing');
  });

  it('a vacation day tops up to expected (balance 0, no projected end)', () => {
    const r = calculateFromPunches([], baseSettings, fixedNow, '2024-01-08', 'vacation');
    expect(r.status).toBe('vacation');
    expect(r.balanceMinutes).toBe(0);
    expect(r.projectedEndTime).toBeNull();
  });

  it('a compensation day is a full-day deficit', () => {
    const r = calculateFromPunches([], baseSettings, fixedNow, '2024-01-08', 'compensation');
    expect(r.status).toBe('compensation');
    expect(r.balanceMinutes).toBe(-480);
  });

  it('leave combined with partial work tops up (filled) or not (compensation)', () => {
    const punches = [
      makePunch('2024-01-08', '09:00', 'in'),
      makePunch('2024-01-08', '12:00', 'out'),
    ];
    const filled = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08', 'sick');
    const comp = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08', 'compensation');
    expect(filled.balanceMinutes).toBe(180);    // leave covers the day, 180 worked is extra
    expect(comp.balanceMinutes).toBe(-300);     // 180 worked - 480
  });

  it('exposes time worked during a filled leave as absence overtime', () => {
    const punches = [
      makePunch('2024-01-08', '09:00', 'in'),
      makePunch('2024-01-08', '12:00', 'out'),
    ];
    const filled = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08', 'vacation');
    const comp = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08', 'compensation');
    const none = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08');
    expect(filled.absenceOvertimeMinutes).toBe(180);
    expect(comp.absenceOvertimeMinutes).toBe(0);
    expect(none.absenceOvertimeMinutes).toBe(0);
  });

  it('work beyond expected on a covered leave is all overtime', () => {
    const punches = [
      makePunch('2024-01-08', '08:00', 'in'),
      makePunch('2024-01-08', '18:00', 'out'),
    ];
    const r = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08', 'sick');
    expect(r.balanceMinutes).toBe(600);
    expect(r.absenceOvertimeMinutes).toBe(600);
  });

  it('work beyond expected on a compensation day turns into positive overtime', () => {
    const punches = [
      makePunch('2024-01-08', '08:00', 'in'),
      makePunch('2024-01-08', '17:00', 'out'),
    ];
    const r = calculateFromPunches(punches, baseSettings, fixedNow, '2024-01-08', 'compensation');
    expect(r.balanceMinutes).toBe(60);
    expect(r.absenceOvertimeMinutes).toBe(0);
  });
});

describe('msUntilNextMinute', () => {
  it('returns the time left until the next wall-clock minute', () => {
    expect(msUntilNextMinute(new Date(2024, 0, 8, 9, 15, 30, 0))).toBe(30_000);
  });

  it('accounts for milliseconds', () => {
    expect(msUntilNextMinute(new Date(2024, 0, 8, 9, 15, 59, 750))).toBe(250);
  });

  it('returns a full minute exactly on a minute boundary', () => {
    expect(msUntilNextMinute(new Date(2024, 0, 8, 9, 15, 0, 0))).toBe(60_000);
  });
});

describe('getCalendarDayStatus', () => {
  // 2024-01-08 is a Monday; 2024-01-13 a Saturday.
  const today = '2024-01-10';
  const firstTracked = '2024-01-09';

  it('flags non-workdays as weekend', () => {
    expect(getCalendarDayStatus('2024-01-13', undefined, baseSettings, today, firstTracked)).toBe('weekend');
  });

  it('returns the leave type for leave days', () => {
    expect(getCalendarDayStatus('2024-01-09', makeDayEntry('2024-01-09', 0, 'sick'), baseSettings, today, firstTracked)).toBe('sick');
  });

  it('marks days after today as future', () => {
    expect(getCalendarDayStatus('2024-01-11', undefined, baseSettings, today, firstTracked)).toBe('future');
  });

  it('marks a day meeting expected hours as complete, including today', () => {
    expect(getCalendarDayStatus(today, makeDayEntry(today, 480), baseSettings, today, firstTracked)).toBe('complete');
  });

  it('marks today as in progress until it is complete, rather than partial', () => {
    expect(getCalendarDayStatus(today, makeDayEntry(today, 120), baseSettings, today, firstTracked)).toBe('inProgress');
    expect(getCalendarDayStatus(today, undefined, baseSettings, today, firstTracked)).toBe('inProgress');
  });

  it('marks past days under expected hours as incomplete', () => {
    expect(getCalendarDayStatus('2024-01-09', makeDayEntry('2024-01-09', 120), baseSettings, today, firstTracked)).toBe('incomplete');
  });

  it('marks unlogged past workdays as missing once tracking has started', () => {
    expect(getCalendarDayStatus('2024-01-09', undefined, baseSettings, today, '2024-01-08')).toBe('missing');
  });

  it('does not flag days before the first tracked day as missing', () => {
    expect(getCalendarDayStatus('2024-01-08', undefined, baseSettings, today, firstTracked)).toBe('untracked');
  });

  it('treats every unlogged past day as untracked when nothing was ever tracked', () => {
    expect(getCalendarDayStatus('2024-01-08', undefined, baseSettings, today, null)).toBe('untracked');
  });
});

describe('dayRowBalance', () => {
  const today = '2024-01-10';

  it('is null for days without an entry, which do not count toward the balance', () => {
    expect(dayRowBalance('2024-01-09', undefined, baseSettings, today)).toBeNull();
  });

  it('is null for today while it is still in progress', () => {
    expect(dayRowBalance(today, makeDayEntry(today, 120), baseSettings, today)).toBeNull();
  });

  it('matches the aggregate contribution for settled days', () => {
    expect(dayRowBalance('2024-01-09', makeDayEntry('2024-01-09', 420), baseSettings, today)).toBe(-60);
    expect(dayRowBalance(today, makeDayEntry(today, 510), baseSettings, today)).toBe(30);
  });

  it('counts weekend work as overtime', () => {
    expect(dayRowBalance('2024-01-06', makeDayEntry('2024-01-06', 90), baseSettings, today)).toBe(90);
  });
});

describe('isValidPunchSequence', () => {
  const d = '2024-01-08';

  it('accepts an empty day and alternating in/out punches', () => {
    expect(isValidPunchSequence([])).toBe(true);
    expect(isValidPunchSequence([makePunch(d, '09:00', 'in'), makePunch(d, '12:00', 'out'), makePunch(d, '13:00', 'in')])).toBe(true);
  });

  it('validates in chronological order regardless of input order', () => {
    expect(isValidPunchSequence([makePunch(d, '12:00', 'out'), makePunch(d, '09:00', 'in')])).toBe(true);
  });

  it('rejects a day starting with a clock-out', () => {
    expect(isValidPunchSequence([makePunch(d, '09:00', 'out')])).toBe(false);
  });

  it('rejects two consecutive punches of the same type', () => {
    expect(isValidPunchSequence([makePunch(d, '09:00', 'in'), makePunch(d, '10:00', 'in')])).toBe(false);
  });

  it('rejects two punches at the same time', () => {
    expect(isValidPunchSequence([makePunch(d, '09:00', 'in'), makePunch(d, '09:00', 'out')])).toBe(false);
  });
});

describe('validateNewPunch', () => {
  const d = '2024-01-08';
  const expectCode = (err: AppError | null, code: string, params?: Record<string, string>) => {
    expect(err).toBeInstanceOf(AppError);
    expect(err?.code).toBe(code);
    if (params) expect(err?.params).toEqual(params);
  };

  it('accepts a first clock-in and an alternating punch', () => {
    expect(validateNewPunch(undefined, 'in', '09:00', false)).toBeNull();
    expect(validateNewPunch(makePunch(d, '09:00', 'in'), 'out', '12:00', false)).toBeNull();
  });

  it('rejects clocking the same direction twice', () => {
    expectCode(validateNewPunch(makePunch(d, '09:00', 'in'), 'in', '10:00', false), 'alreadyClockedIn');
    expectCode(validateNewPunch(makePunch(d, '12:00', 'out'), 'out', '13:00', false), 'alreadyClockedOut');
  });

  it('rejects clocking out before any clock-in', () => {
    expectCode(validateNewPunch(undefined, 'out', '09:00', false), 'clockOutBeforeIn');
  });

  it('rejects a manual time that is not after the last punch', () => {
    expectCode(validateNewPunch(makePunch(d, '09:00', 'in'), 'out', '09:00', true), 'timeMustBeAfter', { time: '09:00' });
  });
});

describe('validatePunchEdit', () => {
  const d = '2024-01-08';

  it('accepts a time strictly between its neighbours', () => {
    expect(validatePunchEdit(makePunch(d, '09:00', 'in'), makePunch(d, '13:00', 'in'), '12:00')).toBeNull();
    expect(validatePunchEdit(undefined, undefined, '12:00')).toBeNull();
  });

  it('rejects a time not after the previous punch', () => {
    const err = validatePunchEdit(makePunch(d, '09:00', 'in'), undefined, '08:30');
    expect(err?.code).toBe('timeMustBeAfter');
    expect(err?.params).toEqual({ time: '09:00' });
  });

  it('rejects a time not before the next punch', () => {
    const err = validatePunchEdit(undefined, makePunch(d, '12:00', 'out'), '12:00');
    expect(err?.code).toBe('timeMustBeBefore');
    expect(err?.params).toEqual({ time: '12:00' });
  });
});
