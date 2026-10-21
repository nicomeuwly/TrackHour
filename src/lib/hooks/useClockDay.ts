'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPunchesByDate } from '@/lib/services/punches.service';
import { addPunch, deletePunches as deletePunchesService, restorePunches as restorePunchesService, updatePunch as updatePunchService, updateEntryNote, setLeaveType as setLeaveTypeService } from '@/lib/services/punches.service';
import { getEntryByDate } from '@/lib/services/entries.service';
import type { Punch, LeaveType } from '@/lib/types';

export function useClockDay(date: string) {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [note, setNote] = useState('');
  const [leaveType, setLeaveTypeState] = useState<LeaveType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, entry] = await Promise.all([getPunchesByDate(date), getEntryByDate(date)]);
      setPunches(p);
      setNote(entry?.note ?? '');
      setLeaveTypeState(entry?.leaveType ?? null);
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

  const deletePunches = useCallback(async (ids: string[]) => {
    try {
      const deleted = await deletePunchesService(ids);
      await load();
      return deleted;
    } catch (e) {
      const msg = String(e);
      setError(msg);
      throw new Error(msg);
    }
  }, [load]);

  const restorePunches = useCallback(async (deleted: Punch[]) => {
    try {
      await restorePunchesService(deleted);
      await load();
    } catch (e) {
      const msg = String(e).replace('Error: ', '');
      setError(msg);
      throw new Error(msg);
    }
  }, [load]);

  const editPunch = useCallback(async (id: string, newTime: string) => {
    try {
      await updatePunchService(id, newTime);
      await load();
    } catch (e) {
      const msg = String(e).replace('Error: ', '');
      setError(msg);
      throw new Error(msg);
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

  const setLeave = useCallback(async (type: LeaveType | null) => {
    try {
      await setLeaveTypeService(date, type);
      setLeaveTypeState(type);
    } catch (e) {
      setError(String(e));
    }
  }, [date]);

  return { punches, note, leaveType, isLoading, error, clockIn, clockOut, deletePunches, restorePunches, editPunch, saveNote, setLeave };
}
