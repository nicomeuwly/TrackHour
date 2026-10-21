'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirstEntryDate } from '@/lib/services/entries.service';

/** Earliest logged day, so views can tell "not tracked yet" apart from "missing". */
export function useFirstTrackedDate() {
  const [firstTrackedDate, setFirstTrackedDate] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setFirstTrackedDate(await getFirstEntryDate());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { firstTrackedDate, refresh };
}
