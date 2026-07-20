'use client';

import { useState, useEffect, useCallback } from 'react';
import { getVacationDaysUsed } from '@/lib/services/entries.service';

/** Tracks how many paid vacation days have been used in the given calendar year. */
export function useVacationUsage(year: number) {
  const [used, setUsed] = useState(0);

  const refresh = useCallback(async () => {
    setUsed(await getVacationDaysUsed(year));
  }, [year]);

  useEffect(() => { refresh(); }, [refresh]);

  return { used, refresh };
}
