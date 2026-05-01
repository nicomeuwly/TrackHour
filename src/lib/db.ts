import Dexie, { type EntityTable } from 'dexie';
import type { Punch, DayEntry, Settings } from '@/lib/types';

export const DEFAULT_SETTINGS: Omit<Settings, 'updatedAt'> = {
  id: 'user-settings',
  expectedHoursPerDay: 8,
  minimumBreakMinutes: 30,
  workDays: [1, 2, 3, 4, 5],
  currency: '',
  locale: 'en',
  theme: 'light',
};

class TrackhourDB extends Dexie {
  punches!: EntityTable<Punch, 'id'>;
  entries!: EntityTable<DayEntry, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('TrackhourDB');
    this.version(1).stores({
      entries: 'id, date',
      settings: 'id',
    });
    this.version(2)
      .stores({
        punches: 'id, date',
        entries: 'id, date',
        settings: 'id',
      })
      .upgrade(tx => tx.table('entries').clear());
  }
}

export const db = new TrackhourDB();
