'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEntriesByMonth } from '@/lib/services/entries.service';
import { getSettings } from '@/lib/services/settings.service';
import { calculateMonthBalance } from '@/lib/business/calculations';
import type { DayEntry, MonthBalance } from '@/lib/types';

export function useMonthEntries(year: number, month: number) {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [monthBalance, setMonthBalance] = useState<MonthBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, settings] = await Promise.all([
        getEntriesByMonth(year, month),
        getSettings(),
      ]);
      setEntries(data);
      setMonthBalance(calculateMonthBalance(data, settings));
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  return { entries, isLoading, error, monthBalance, refresh: load };
}
