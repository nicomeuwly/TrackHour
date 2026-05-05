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
} from './calculations';
import type { DayEntry, Punch, Settings } from '@/lib/types';

const baseSettings: Settings = {
  id: 'user-settings',
  expectedHoursPerDay: 8,
  minimumBreakMinutes: 30,
  workDays: [1, 2, 3, 4, 5],
  currency: '',
  locale: 'en',
  theme: 'light',
  updatedAt: '',
};

function makeDayEntry(date: string, totalWorkedMinutes: number): DayEntry {
  return { id: date, date, punches: [], totalWorkedMinutes, totalBreakMinutes: 0, note: '', updatedAt: '' };
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
});
