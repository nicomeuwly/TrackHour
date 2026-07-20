export interface Punch {
  id: string;
  date: string;
  time: string;
  type: 'in' | 'out';
  isManual: boolean;
  createdAt: string;
}

/**
 * Type of full-day absence.
 * - `vacation`, `sick`, `other`: balance-neutral, top the day up to expected hours.
 * - `compensation`: not topped up, so the day counts as a full-day deficit that
 *   draws down the accumulated overtime balance.
 */
export type LeaveType = 'vacation' | 'sick' | 'other' | 'compensation';

export interface DayEntry {
  id: string;
  date: string;
  punches: Punch[];
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  leaveType: LeaveType | null;
  note: string;
  updatedAt: string;
}

export interface DayCalculation {
  workedMinutes: number;
  breakMinutes: number;
  liveBreakMinutes: number;
  isBreakSufficient: boolean;
  projectedEndTime: string | null;
  balanceMinutes: number;
  leaveType: LeaveType | null;
  status: DayStatus;
  lastPunchType: 'in' | 'out' | null;
}

export interface Settings {
  id: string;
  expectedHoursPerDay: number;
  minimumBreakMinutes: number;
  workDays: number[];
  annualVacationDays: number;
  currency: string;
  locale: string;
  theme: string;
  updatedAt: string;
}

export interface WeekBalance {
  totalWorkedMinutes: number;
  totalExpectedMinutes: number;
  balanceMinutes: number;
  daysLogged: number;
  daysExpected: number;
}

export interface MonthBalance extends WeekBalance {
  averageHoursPerDay: number;
}

export type DayStatus = 'complete' | 'incomplete' | 'missing' | 'weekend' | 'vacation' | 'sick' | 'other' | 'compensation';
