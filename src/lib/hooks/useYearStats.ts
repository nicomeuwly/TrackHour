'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEntriesByRange } from '@/lib/services/entries.service';
import { calculateWeekBalance, localDateStr } from '@/lib/business/calculations';
import type { Settings } from '@/lib/types';

interface YearStats {
  overtimeMinutes: number;
  absenceOvertimeMinutes: number;
  absenceDays: number;
  vacationUsed: number;
  workedDays: number;
  totalWorkdays: number;
}

const EMPTY: YearStats = { overtimeMinutes: 0, absenceOvertimeMinutes: 0, absenceDays: 0, vacationUsed: 0, workedDays: 0, totalWorkdays: 0 };

/** Calendar-year totals: overtime balance (and the part earned during absences),
 *  absence days, vacation used, days worked. */
export function useYearStats(year: number, settings: Settings | null) {
  const [stats, setStats] = useState<YearStats>(EMPTY);

  const refresh = useCallback(async () => {
    if (!settings) return;
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const entries = await getEntriesByRange(start, end);
    // Same aggregation as the week/month views, over the whole calendar year.
    const totals = calculateWeekBalance(entries, settings, start, end, localDateStr(new Date()));
    setStats({
      overtimeMinutes: totals.balanceMinutes,
      absenceOvertimeMinutes: totals.absenceOvertimeMinutes,
      absenceDays: entries.filter(e => e.leaveType !== null).length,
      vacationUsed: entries.filter(e => e.leaveType === 'vacation').length,
      workedDays: entries.filter(e => e.totalWorkedMinutes > 0).length,
      totalWorkdays: totals.daysExpected,
    });
  }, [year, settings]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...stats, refresh };
}
