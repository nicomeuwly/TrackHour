'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEntriesByRange } from '@/lib/services/entries.service';
import { dayBalanceMinutes, isWorkday, countExpectedDays, countsTowardBalance, localDateStr } from '@/lib/business/calculations';
import type { Settings } from '@/lib/types';

interface YearStats {
  overtimeMinutes: number;
  absenceDays: number;
  vacationUsed: number;
  workedDays: number;
  totalWorkdays: number;
}

/** Calendar-year totals: overtime balance, absence days, vacation used, days worked. */
export function useYearStats(year: number, settings: Settings | null) {
  const [stats, setStats] = useState<YearStats>({ overtimeMinutes: 0, absenceDays: 0, vacationUsed: 0, workedDays: 0, totalWorkdays: 0 });

  const refresh = useCallback(async () => {
    if (!settings) return;
    const entries = await getEntriesByRange(`${year}-01-01`, `${year}-12-31`);
    const today = localDateStr(new Date());
    const overtimeMinutes = entries.reduce((sum, e) => {
      if (!countsTowardBalance(e, settings, today)) return sum;
      return sum + dayBalanceMinutes(e, settings, isWorkday(e.date, settings.workDays));
    }, 0);
    const absenceDays = entries.filter(e => e.leaveType !== null).length;
    const vacationUsed = entries.filter(e => e.leaveType === 'vacation').length;
    const workedDays = entries.filter(e => e.totalWorkedMinutes > 0).length;
    const totalWorkdays = countExpectedDays(`${year}-01-01`, `${year}-12-31`, settings.workDays);
    setStats({ overtimeMinutes, absenceDays, vacationUsed, workedDays, totalWorkdays });
  }, [year, settings]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...stats, refresh };
}
