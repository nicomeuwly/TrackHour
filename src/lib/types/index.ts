export interface Punch {
  id: string;
  date: string;
  time: string;
  type: 'in' | 'out';
  isManual: boolean;
  createdAt: string;
}

export interface DayEntry {
  id: string;
  date: string;
  punches: Punch[];
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
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
  status: DayStatus;
  lastPunchType: 'in' | 'out' | null;
}

export interface Settings {
  id: string;
  expectedHoursPerDay: number;
  minimumBreakMinutes: number;
  workDays: number[];
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

export type DayStatus = 'complete' | 'incomplete' | 'missing' | 'weekend';
