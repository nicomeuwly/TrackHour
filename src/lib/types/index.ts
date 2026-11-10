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
 * - `vacation`, `sick`, `other`: cover the day's expected hours, so any time worked
 *   on such a day is entirely overtime (tracked separately as absence overtime).
 * - `compensation`: not covered, so the day draws down the accumulated overtime by
 *   the expected hours minus any time worked (excess work becomes overtime).
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
  /** Worked minutes on a covered absence (vacation, sick, other): all overtime. */
  absenceOvertimeMinutes: number;
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
  /** Part of balanceMinutes earned by working during covered absences. */
  absenceOvertimeMinutes: number;
  daysLogged: number;
  daysExpected: number;
}

export interface MonthBalance extends WeekBalance {
  averageHoursPerDay: number;
}

export type DayStatus = 'complete' | 'incomplete' | 'missing' | 'weekend' | 'vacation' | 'sick' | 'other' | 'compensation';

/** Status of a day in the week/month views. Adds states that only make sense relative
 *  to today and to when tracking started, so they never read as a deficit. */
export type CalendarDayStatus = DayStatus | 'future' | 'inProgress' | 'untracked';
