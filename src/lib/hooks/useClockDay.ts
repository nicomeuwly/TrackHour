'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPunchesByDate } from '@/lib/services/punches.service';
import { addPunch, deletePunch as deletePunchService, updateEntryNote } from '@/lib/services/punches.service';
import { getEntryByDate } from '@/lib/services/entries.service';
import type { Punch } from '@/lib/types';

export function useClockDay(date: string) {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, entry] = await Promise.all([getPunchesByDate(date), getEntryByDate(date)]);
      setPunches(p);
      setNote(entry?.note ?? '');
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const clockIn = useCallback(async (manualTime?: string) => {
    try {
      await addPunch(date, 'in', manualTime, !!manualTime);
      await load();
    } catch (e) {
      const msg = String(e);
      setError(msg);
      throw new Error(msg);
    }
  }, [date, load]);

  const clockOut = useCallback(async (manualTime?: string) => {
    try {
      await addPunch(date, 'out', manualTime, !!manualTime);
      await load();
    } catch (e) {
      const msg = String(e);
      setError(msg);
      throw new Error(msg);
    }
  }, [date, load]);

  const deletePunch = useCallback(async (id: string) => {
    try {
      await deletePunchService(id);
      await load();
    } catch (e) {
      setError(String(e));
    }
  }, [load]);

  const saveNote = useCallback(async (text: string) => {
    setNote(text);
    try {
      await updateEntryNote(date, text);
    } catch (e) {
      setError(String(e));
    }
  }, [date]);

  return { punches, note, isLoading, error, clockIn, clockOut, deletePunch, saveNote };
}
