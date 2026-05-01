'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEntriesByRange } from '@/lib/services/entries.service';
import { getSettings } from '@/lib/services/settings.service';
import { calculateWeekBalance, getWeekDates } from '@/lib/business/calculations';
import type { DayEntry, WeekBalance } from '@/lib/types';

export function useWeekEntries(date: string) {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [weekBalance, setWeekBalance] = useState<WeekBalance | null>(null);
  const [weekDates, setWeekDates] = useState<{ start: string; end: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const dates = getWeekDates(date);
      const [data, settings] = await Promise.all([
        getEntriesByRange(dates.start, dates.end),
        getSettings(),
      ]);
      setWeekDates(dates);
      setEntries(data);
      setWeekBalance(calculateWeekBalance(data, settings));
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  return { entries, isLoading, error, weekBalance, weekDates, refresh: load };
}
