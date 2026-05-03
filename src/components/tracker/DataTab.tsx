'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useWeekEntries } from '@/lib/hooks/useWeekEntries';
import { useMonthEntries } from '@/lib/hooks/useMonthEntries';
import { useSettings } from '@/lib/hooks/useSettings';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import AdSenseUnit from '@/components/ads/AdSenseUnit';
import BalanceDisplay from '@/components/ui/BalanceDisplay';
import {
  getWeekDates,
  getMonthDates,
  localDateStr,
  formatMinutes,
} from '@/lib/business/calculations';
import {
  exportPeriodAsCSV,
  deletePeriodData,
  deleteAllData,
} from '@/lib/services/export.service';
import { exportData, importData } from '@/lib/services/backup.service';
import type { DayEntry, Settings } from '@/lib/types';

interface DataTabProps {
  onNavigateToDay?: (date: string) => void;
}

type CellStatus = 'complete' | 'incomplete' | 'missing' | 'weekend' | 'future';

function getCellStatus(date: string, entry: DayEntry | undefined, settings: Settings, today: string): CellStatus {
  const dow = new Date(date + 'T00:00:00').getDay();
  const isoDay = dow === 0 ? 7 : dow;
  if (!settings.workDays.includes(isoDay)) return 'weekend';
  if (date > today) return 'future';
  if (!entry) return 'missing';
  if (entry.totalWorkedMinutes >= settings.expectedHoursPerDay * 60) return 'complete';
  return 'incomplete';
}

function compactHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

const CELL_BG: Record<CellStatus, string> = {
  complete: 'bg-teal-50 dark:bg-teal-900/20',
  incomplete: 'bg-orange-50 dark:bg-orange-900/20',
  missing: 'bg-red-50 dark:bg-red-900/20',
  weekend: 'bg-foreground/4',
  future: '',
};

const STATUS_BADGE: Record<Exclude<CellStatus, 'future'>, string> = {
  complete: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  incomplete: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  missing: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  weekend: 'bg-foreground/8 text-foreground/40',
};

type DeleteTarget =
  | { kind: 'week'; start: string; end: string; label: string }
  | { kind: 'month'; start: string; end: string; label: string }
  | { kind: 'all' };

export default function DataTab({ onNavigateToDay }: DataTabProps) {
  const t = useTranslations('DataTab');
  const locale = useLocale();
  const today = localDateStr(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [refDate, setRefDate] = useState(today);
  const [deleteModal, setDeleteModal] = useState<DeleteTarget | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const { settings } = useSettings();
  const { showToast } = useToast();

  const refYear = parseInt(refDate.slice(0, 4));
  const refMonth = parseInt(refDate.slice(5, 7));
  const weekDates = getWeekDates(refDate);
  const monthDates = getMonthDates(refYear, refMonth);

  const { entries: weekEntries, weekBalance, isLoading: weekLoading, refresh: weekRefresh } =
    useWeekEntries(refDate);
  const { entries: monthEntries, monthBalance, isLoading: monthLoading, refresh: monthRefresh } =
    useMonthEntries(refYear, refMonth);

  // Locale-aware date helpers
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i))
  );
  const DAY_HEADERS = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i))
  );

  function getWeekLabel(start: string, end: string): string {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).formatRange(s, e);
  }

  function getMonthLabel(year: number, month: number): string {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
  }

  function shiftPeriod(delta: number) {
    const d = new Date(refDate + 'T00:00:00');
    if (view === 'week') {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setDate(1);
      d.setMonth(d.getMonth() + delta);
    }
    setRefDate(localDateStr(d));
  }

  const isCurrentPeriod = view === 'week'
    ? weekDates.start <= today && weekDates.end >= today
    : refYear === parseInt(today.slice(0, 4)) && refMonth === parseInt(today.slice(5, 7));

  const periodLabel = view === 'week'
    ? getWeekLabel(weekDates.start, weekDates.end)
    : getMonthLabel(refYear, refMonth);

  const balance = view === 'week' ? weekBalance : monthBalance;
  const isLoading = view === 'week' ? weekLoading : monthLoading;

  const activeEntries = view === 'week' ? weekEntries : monthEntries;
  const entriesByDate: Record<string, DayEntry> = {};
  for (const e of activeEntries) {
    entriesByDate[e.date] = e;
  }

  function refreshAll() {
    weekRefresh();
    monthRefresh();
  }

  async function handleExportCSV(type: 'week' | 'month') {
    try {
      const dates = type === 'week' ? weekDates : monthDates;
      const label = type === 'week'
        ? `week-${weekDates.start}`
        : `${new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(refYear, refMonth - 1, 1))}-${refYear}`;
      await exportPeriodAsCSV(dates.start, dates.end, label);
      showToast(t('toastExportCSV'), 'success');
    } catch (e) {
      showToast(String(e), 'error');
    }
  }

  async function handleExportJSON() {
    try {
      await exportData();
      showToast(t('toastExportJSON'), 'success');
    } catch (e) {
      showToast(String(e), 'error');
    }
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importData(file);
      if (result.success) {
        showToast(t('toastImported', { count: result.entriesImported }), 'success');
      } else {
        showToast(result.errors[0] ?? 'Import failed', 'error');
      }
      refreshAll();
    } catch (err) {
      showToast(String(err), 'error');
    }
    e.target.value = '';
  }

  async function handleDeleteConfirm() {
    if (!deleteModal) return;
    setIsProcessing(true);
    try {
      if (deleteModal.kind === 'all') {
        await deleteAllData();
        showToast(t('toastDeletedAll'), 'success');
      } else {
        const count = await deletePeriodData(deleteModal.start, deleteModal.end);
        showToast(t('toastDeleted', { count }), 'success');
      }
      refreshAll();
      setDeleteModal(null);
    } catch (err) {
      showToast(String(err), 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  // Build the 7 dates for the week view list
  const weekDatesArr: string[] = [];
  const weekStart = new Date(weekDates.start + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDatesArr.push(localDateStr(d));
  }

  // Month calendar
  const daysInMonth = new Date(refYear, refMonth, 0).getDate();
  const firstDow = new Date(monthDates.start + 'T00:00:00').getDay();
  const padCells = firstDow === 0 ? 6 : firstDow - 1;

  const avgMinutes = balance && balance.daysLogged > 0
    ? Math.round(balance.totalWorkedMinutes / balance.daysLogged)
    : 0;

  const STATUS_LABEL: Record<Exclude<CellStatus, 'future'>, string> = {
    complete: t('statusComplete'),
    incomplete: t('statusPartial'),
    missing: t('statusMissing'),
    weekend: t('statusWeekend'),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Period header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-foreground/6 rounded-xl p-0.5">
            {(['week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-background shadow-sm text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
              >
                {v === 'week' ? t('viewWeek') : t('viewMonth')}
              </button>
            ))}
          </div>
          {!isCurrentPeriod && (
            <button
              onClick={() => setRefDate(today)}
              className="text-xs font-medium text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/8 transition-colors"
            >
              {view === 'week' ? t('thisWeek') : t('thisMonth')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftPeriod(-1)} aria-label={view === 'week' ? t('prevWeek') : t('prevMonth')}
            className="p-2 rounded-lg hover:bg-foreground/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <polyline points="10 4 6 8 10 12"/>
            </svg>
          </button>
          <span className="flex-1 text-center text-sm font-semibold">{periodLabel}</span>
          <button onClick={() => shiftPeriod(1)} aria-label={view === 'week' ? t('nextWeek') : t('nextMonth')}
            className="p-2 rounded-lg hover:bg-foreground/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <polyline points="6 4 10 8 6 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl bg-foreground/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-foreground/10 px-4 py-3">
            <p className="text-xs text-foreground/50 mb-1">{t('totalWorked')}</p>
            <p className="font-bold text-base">{balance ? formatMinutes(balance.totalWorkedMinutes) : '—'}</p>
          </div>
          <div className="rounded-xl border border-foreground/10 px-4 py-3">
            <p className="text-xs text-foreground/50 mb-1">{t('balance')}</p>
            <p className="font-bold text-base">
              {balance ? <BalanceDisplay balanceMinutes={balance.balanceMinutes} /> : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-foreground/10 px-4 py-3">
            <p className="text-xs text-foreground/50 mb-1">{t('daysLogged')}</p>
            <p className="font-bold text-base">
              {balance ? `${balance.daysLogged} / ${balance.daysExpected}` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-foreground/10 px-4 py-3">
            <p className="text-xs text-foreground/50 mb-1">{t('avgPerDay')}</p>
            <p className="font-bold text-base">{avgMinutes > 0 ? formatMinutes(avgMinutes) : '—'}</p>
          </div>
        </div>
      )}

      {/* Week day list */}
      {view === 'week' && (
        weekLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-xl bg-foreground/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="rounded-xl border border-foreground/10 overflow-hidden divide-y divide-foreground/6">
            {weekDatesArr.map((date, i) => {
              const entry = entriesByDate[date];
              const status = settings ? getCellStatus(date, entry, settings, today) : 'future';
              const d = new Date(date + 'T00:00:00');
              const dayNum = d.getDate();
              const monthStr = new Intl.DateTimeFormat(locale, { month: 'short' }).format(d);
              const balanceMinutes: number | null = (() => {
                if (!settings || status === 'weekend' || status === 'future') return null;
                if (entry) return entry.totalWorkedMinutes - settings.expectedHoursPerDay * 60;
                return -settings.expectedHoursPerDay * 60;
              })();

              return (
                <button
                  key={date}
                  onClick={() => onNavigateToDay?.(date)}
                  aria-label={d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left ${status === 'weekend' || status === 'future' ? 'opacity-55' : ''}`}
                >
                  <div className="w-14 flex-none">
                    <p className={`text-sm font-semibold ${date === today ? 'text-accent' : ''}`}>
                      {DAY_LABELS[i]} <span className="font-normal text-foreground/50">{dayNum}</span>
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry ? (
                      <p className="text-sm font-medium">{formatMinutes(entry.totalWorkedMinutes)}</p>
                    ) : (
                      <p className="text-sm text-foreground/25">—</p>
                    )}
                  </div>
                  <div className="flex-none min-w-20 text-right">
                    {balanceMinutes !== null ? (
                      <BalanceDisplay balanceMinutes={balanceMinutes} />
                    ) : (
                      <span className="text-sm text-foreground/20">—</span>
                    )}
                  </div>
                  <div className="flex-none">
                    {status !== 'future' && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}

      {/* Month calendar */}
      {view === 'month' && (
        monthLoading ? (
          <div className="h-64 rounded-xl bg-foreground/5 animate-pulse" />
        ) : (
          <div>
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-foreground/40 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: padCells }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${refYear}-${String(refMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const entry = entriesByDate[dateStr];
                const status = settings ? getCellStatus(dateStr, entry, settings, today) : 'future';
                const isToday = dateStr === today;

                return (
                  <button
                    key={day}
                    onClick={() => onNavigateToDay?.(dateStr)}
                    aria-label={new Date(refYear, refMonth - 1, day).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                    className={`rounded-lg p-0.5 flex flex-col items-center justify-center aspect-square min-h-9.5 transition-colors hover:brightness-95 active:scale-95 ${CELL_BG[status]} ${isToday ? 'ring-1 ring-accent ring-inset' : ''}`}
                  >
                    <span className={`text-xs font-semibold leading-none ${isToday ? 'text-accent' : status === 'future' ? 'text-foreground/30' : ''}`}>
                      {day}
                    </span>
                    {entry && (
                      <span className="text-[9px] text-foreground/50 leading-none mt-0.5">
                        {compactHours(entry.totalWorkedMinutes)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* AdSense */}
      <AdSenseUnit
        slot="XXXXXXXX"
        format={view === 'month' ? 'rectangle' : 'horizontal'}
      />

      {/* Data management */}
      <div className="flex flex-col gap-5 pt-1">
        <h2 className="text-sm font-semibold">{t('manageData')}</h2>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">{t('exportSection')}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleExportCSV('week')}
              className="text-sm border border-foreground/15 rounded-lg px-3 py-2 hover:bg-foreground/5 transition-colors">
              {t('exportWeekCSV')}
            </button>
            <button onClick={() => handleExportCSV('month')}
              className="text-sm border border-foreground/15 rounded-lg px-3 py-2 hover:bg-foreground/5 transition-colors">
              {t('exportMonthCSV')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportJSON}
              className="text-sm border border-foreground/15 rounded-lg px-3 py-2 hover:bg-foreground/5 transition-colors">
              {t('exportJSON')}
            </button>
            <button onClick={() => importRef.current?.click()}
              className="text-sm border border-foreground/15 rounded-lg px-3 py-2 hover:bg-foreground/5 transition-colors">
              {t('importJSON')}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="sr-only"
              aria-label={t('importAriaLabel')}
              onChange={handleImportChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wide">{t('deleteSection')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDeleteModal({ kind: 'week', start: weekDates.start, end: weekDates.end, label: getWeekLabel(weekDates.start, weekDates.end) })}
              className="text-sm border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {t('deleteWeek')}
            </button>
            <button
              onClick={() => setDeleteModal({ kind: 'month', start: monthDates.start, end: monthDates.end, label: getMonthLabel(refYear, refMonth) })}
              className="text-sm border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {t('deleteMonth')}
            </button>
            <button
              onClick={() => setDeleteModal({ kind: 'all' })}
              className="text-sm border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {t('deleteAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <Modal
          isOpen
          onClose={() => { if (!isProcessing) setDeleteModal(null); }}
          title={t('deleteModalTitle')}
        >
          <div className="flex flex-col gap-5">
            <p className="text-sm text-foreground/70">
              {deleteModal.kind === 'all'
                ? t('deleteAllConfirm')
                : deleteModal.kind === 'week'
                  ? t('deleteWeekConfirm', { label: deleteModal.label })
                  : t('deleteMonthConfirm', { label: deleteModal.label })}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium border border-foreground/15 rounded-lg hover:bg-foreground/5 transition-colors disabled:opacity-40"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {isProcessing ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
