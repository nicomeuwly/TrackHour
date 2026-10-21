'use client';

import { useState, useEffect, useRef, useId, Fragment, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  Trash2, ArrowRight, Coffee, Calendar, ChevronLeft, ChevronRight,
  Play, Briefcase, Square, Check, TriangleAlert,
} from 'lucide-react';
import { useClockDay } from '@/lib/hooks/useClockDay';
import { useSettings } from '@/lib/hooks/useSettings';
import { useVacationUsage } from '@/lib/hooks/useVacationUsage';
import {
  calculateFromPunches,
  formatMinutes,
  localDateStr,
  msUntilNextMinute,
} from '@/lib/business/calculations';
import { useToast } from '@/components/ui/Toast';
import { useErrorMessage } from '@/lib/hooks/useErrorMessage';
import BalanceDisplay from '@/components/ui/BalanceDisplay';
import LeaveModal from '@/components/tracker/LeaveModal';
import { LEAVE_LABEL_KEY, LEAVE_DESC_KEY, LEAVE_ICON, ABSENCE_ICON } from '@/components/tracker/leaveMeta';
import type { Punch, LeaveType } from '@/lib/types';

interface ClockTabProps {
  date: string;
  onDateChange: (date: string) => void;
  /** Extra control rendered at the end of the date header (e.g. a settings button). */
  headerAction?: ReactNode;
}

function shiftDate(d: string, delta: number): string {
  const date = new Date(d + 'T00:00:00');
  date.setDate(date.getDate() + delta);
  return localDateStr(date);
}

// ── Punch timeline ──────────────────────────────────────────────────────────

type PunchAction = { kind: 'edit'; id: string; value: string } | null;

type PunchPair = { inPunch: Punch; outPunch: Punch | null };

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildPairs(punches: Punch[]): PunchPair[] {
  const pairs: PunchPair[] = [];
  let i = 0;
  while (i < punches.length) {
    const p = punches[i];
    if (p.type === 'in') {
      const next = punches[i + 1];
      if (next?.type === 'out') {
        pairs.push({ inPunch: p, outPunch: next });
        i += 2;
      } else {
        pairs.push({ inPunch: p, outPunch: null });
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return pairs;
}


const TrashIcon = () => <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" aria-hidden />;

const EDITABLE_TIME_CLASS =
  'inline-flex items-center min-h-11 sm:min-h-0 px-1.5 -mx-1.5 rounded-md text-sm font-semibold tabular-nums underline decoration-dotted underline-offset-4 hover:decoration-solid';

const ArrowIcon = () => <ArrowRight size={12} className="flex-none text-text/25" aria-hidden />;

function PunchTimeline({
  punches,
  onDelete,
  onEdit,
}: {
  punches: Punch[];
  onDelete: (ids: string[]) => void;
  onEdit: (id: string, newTime: string) => Promise<void>;
}) {
  const t = useTranslations('ClockTab');
  const [action, setAction] = useState<PunchAction>(null);

  if (punches.length === 0) return null;

  const pairs = buildPairs(punches);
  const inputClass = "rounded-lg border border-text/15 bg-background px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:[&::-webkit-calendar-picker-indicator]:invert";

  return (
    <div className="flex flex-col gap-1 bg-background rounded-xl" role="list" aria-label={t('punchTimeline')}>
      {pairs.map((pair, pairIdx) => {
        const { inPunch, outPunch } = pair;
        const prevPair = pairIdx > 0 ? pairs[pairIdx - 1] : null;

        const breakMins = prevPair?.outPunch
          ? toMins(inPunch.time) - toMins(prevPair.outPunch.time)
          : null;

        const durationMins = outPunch
          ? toMins(outPunch.time) - toMins(inPunch.time)
          : null;

        const isEditingIn = action?.kind === 'edit' && action.id === inPunch.id;
        const isEditingOut = !!(outPunch && action?.kind === 'edit' && action.id === outPunch.id);
        const editValue = action?.kind === 'edit' ? action.value : '';

        return (
          <Fragment key={inPunch.id}>
            {/* Break separator before this pair */}
            {breakMins !== null && (
              <div className="flex items-center gap-3 px-3 py-0.5" aria-hidden>
                <div className="flex-none w-2 flex justify-center">
                  <div className="w-px h-4 bg-text/15" />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
                  <Coffee size={11} aria-hidden />
                  {formatMinutes(breakMins)}
                </span>
              </div>
            )}

            {/* Pair row — edit mode */}
            {(isEditingIn || isEditingOut) ? (
              <div role="listitem" className="flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-2 min-h-14 sm:min-h-12 rounded-xl bg-text/4">
                {isEditingIn ? (
                  <input type="time" value={editValue}
                    onChange={e => setAction({ kind: 'edit', id: inPunch.id, value: e.target.value })}
                    className={inputClass} autoFocus />
                ) : (
                  <span className="text-sm font-semibold tabular-nums text-primary">{inPunch.time}</span>
                )}
                <ArrowIcon />
                {isEditingOut && outPunch ? (
                  <input type="time" value={editValue}
                    onChange={e => setAction({ kind: 'edit', id: outPunch.id, value: e.target.value })}
                    className={inputClass} autoFocus />
                ) : outPunch ? (
                  <span className="text-sm font-semibold tabular-nums text-secondary">{outPunch.time}</span>
                ) : (
                  <span className="text-sm text-text-muted">…</span>
                )}
                <button
                  onClick={async () => {
                    if (!editValue) return;
                    await onEdit(isEditingIn ? inPunch.id : outPunch!.id, editValue);
                    setAction(null);
                  }}
                  disabled={!editValue}
                  className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:opacity-90 ml-1"
                >
                  {t('confirm')}
                </button>
                <button onClick={() => setAction(null)} className="text-xs text-text/40 hover:text-text/70">
                  {t('editCancel')}
                </button>
              </div>
            ) : (
              /* Pair row — normal. Times carry a dotted underline so they read as
                 editable without hover (touch); deletion is immediate with an undo toast. */
              <div role="listitem" className="flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-2 min-h-14 sm:min-h-12 rounded-xl hover:bg-text/4 group">
                <span className="flex-none w-2 h-2 rounded-full bg-primary" aria-hidden />
                <button
                  onClick={() => setAction({ kind: 'edit', id: inPunch.id, value: inPunch.time })}
                  aria-label={t('editPunchLabel', { time: inPunch.time })}
                  className={`${EDITABLE_TIME_CLASS} text-primary decoration-primary/40`}
                >
                  {inPunch.time}
                </button>
                <ArrowIcon />
                {outPunch ? (
                  <button
                    onClick={() => setAction({ kind: 'edit', id: outPunch.id, value: outPunch.time })}
                    aria-label={t('editPunchLabel', { time: outPunch.time })}
                    className={`${EDITABLE_TIME_CLASS} text-secondary decoration-secondary/40`}
                  >
                    {outPunch.time}
                  </button>
                ) : (
                  <span className="text-sm text-text-muted">…</span>
                )}
                {durationMins !== null && (
                  <>
                    <span className="text-sm text-text/30 select-none" aria-hidden>:</span>
                    <span className="text-sm font-semibold tabular-nums">{formatMinutes(durationMins)}</span>
                  </>
                )}
                <span className="flex-1" />
                {/* Hidden until hover only where hover exists (fine pointer); always
                    visible on touch, and revealed on keyboard focus. */}
                <button
                  onClick={() => onDelete(outPunch ? [inPunch.id, outPunch.id] : [inPunch.id])}
                  aria-label={t('deletePunchLabel', { time: inPunch.time })}
                  className="inline-flex items-center justify-center size-11 sm:size-8 -mr-2 sm:mr-0 rounded-lg hover:bg-text/8 text-text/40 hover:text-secondary pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 focus-visible:opacity-100"
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Manual time input ───────────────────────────────────────────────────────

function ManualInput({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('ClockTab');
  const [value, setValue] = useState('');
  const inputId = useId();
  return (
    <div className="flex items-center gap-2 py-1">
      <label htmlFor={inputId} className="text-sm text-text/60 whitespace-nowrap">{label}</label>
      <input id={inputId} type="time" value={value} onChange={e => setValue(e.target.value)}
        className="rounded-lg border border-text/15 bg-background px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:[&::-webkit-calendar-picker-indicator]:invert"
        autoFocus
      />
      <button onClick={() => value && onConfirm(value)}
        disabled={!value}
        className="px-3 py-1 bg-primary text-white text-sm rounded-lg disabled:opacity-40 hover:opacity-90"
      >
        {t('confirm')}
      </button>
      <button onClick={onCancel} className="text-sm text-text-muted hover:text-text">{t('cancel')}</button>
    </div>
  );
}

// ── Mini date picker ─────────────────────────────────────────────────────────

function DatePickerPopup({ current, onSelect, onClose }: { current: string; onSelect: (d: string) => void; onClose: () => void }) {
  const t = useTranslations('ClockTab');
  const locale = useLocale();
  const [viewYear, setViewYear] = useState(() => parseInt(current.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(current.slice(5, 7)));
  const today = localDateStr(new Date());

  const MONTHS = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2024, i, 1))
  );
  const DAY_HEADERS = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i))
  );

  const firstDow = new Date(`${viewYear}-${String(viewMonth).padStart(2, '0')}-01T00:00:00`).getDay();
  const pad = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  function prevM() { if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); } else setViewMonth(m => m - 1); }
  function nextM() { if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); } else setViewMonth(m => m + 1); }

  return (
    <div className="popover-enter absolute top-full left-0 z-50 mt-2 bg-background border border-text/15 rounded-xl shadow-xl p-3 w-64" role="dialog" aria-label={t('pickDate')}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevM} className={DAY_NAV_BUTTON_CLASS} aria-label={t('previousMonth')}>
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="text-sm font-semibold capitalize" aria-live="polite">{MONTHS[viewMonth - 1]} {viewYear}</span>
        <button onClick={nextM} className={DAY_NAV_BUTTON_CLASS} aria-label={t('nextMonth')}>
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-xs text-text-muted font-medium py-0.5" aria-hidden>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: pad }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === current;
          const isToday = dateStr === today;
          return (
            <button key={day} onClick={() => { onSelect(dateStr); onClose(); }}
              className={`aspect-square rounded-lg text-xs font-medium ${isSelected ? 'bg-primary text-white' : isToday ? 'ring-1 ring-primary text-primary' : 'hover:bg-text/8'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Segmented progress bar ───────────────────────────────────────────────────

const PAUSE_HATCH = 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, transparent 3px, transparent 9px)';

function useSegmentCount() {
  const [count, setCount] = useState(24);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 479px)');
    const update = () => setCount(mq.matches ? 12 : 24);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return count;
}

function SegmentedProgressBar({ progressPct, isPaused }: { progressPct: number; isPaused: boolean }) {
  const SEGMENTS = useSegmentCount();
  const filled = Math.min((progressPct / 100) * SEGMENTS, SEGMENTS);
  const completedCount = Math.floor(filled);
  // When actively working at 0%, pulse the first segment as immediate feedback
  const hasPartial = (filled % 1 > 0 || (filled === 0 && !isPaused)) && completedCount < SEGMENTS;

  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const isComplete = i < completedCount;
        const isPartial = hasPartial && i === completedCount;

        if (!isComplete && !isPartial) {
          return <div key={i} className="flex-1 h-12 rounded-sm bg-text/10" />;
        }
        return (
          <div
            key={i}
            className={`flex-1 h-12 rounded-sm bg-primary ${isPartial && !isPaused ? 'segment-pulse' : ''}`}
            style={{
              backgroundImage: isPaused ? PAUSE_HATCH : undefined,
              opacity: isPartial && isPaused ? 0.45 : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function DayProgress({ progressPct, isPaused, startTime, endTime }: {
  progressPct: number;
  isPaused: boolean;
  startTime: string;
  endTime: string | null;
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <SegmentedProgressBar progressPct={progressPct} isPaused={isPaused} />
      <div className="flex justify-between">
        <span className="text-xs font-semibold text-text/50 tabular-nums">{startTime}</span>
        {endTime && <span className="text-xs font-semibold text-text/50 tabular-nums">{endTime}</span>}
      </div>
    </div>
  );
}

// ── Clock actions ────────────────────────────────────────────────────────────

const CLOCK_BUTTON_TONE = {
  in: 'border-primary bg-primary/10 text-primary hover:bg-primary/20',
  out: 'border-secondary bg-secondary/10 text-secondary hover:bg-secondary/20',
} as const;

const CLOCK_BUTTON_ICON = { in: Play, out: Square } as const;

// Manual entry is a quiet link next to a primary clock button, and becomes the
// secondary button itself when it is the only available action (past days, leave).
const MANUAL_LINK_CLASS = 'min-h-11 px-3 text-sm text-text/50 hover:text-text/80';
const MANUAL_BUTTON_CLASS = 'border border-text/20 text-text/60 px-8 py-3 rounded-xl font-semibold text-base hover:bg-text/5';

// Chips stay visually compact (h-8) while a pseudo-element extends the touch
// target to 44px on coarse pointers.
const CHIP_HIT_AREA_CLASS = 'relative h-8 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1.5';

const DAY_NAV_BUTTON_CLASS = 'inline-flex flex-none items-center justify-center size-11 sm:size-9 rounded-lg hover:bg-text/8';

function ClockActions({
  kind,
  label,
  manualLabel,
  canClockNow,
  manualMode,
  onClock,
  onOpenManual,
  onCancelManual,
}: {
  kind: 'in' | 'out';
  label: string;
  manualLabel: string;
  canClockNow: boolean;
  manualMode: boolean;
  onClock: (manualTime?: string) => void;
  onOpenManual: () => void;
  onCancelManual: () => void;
}) {
  const t = useTranslations('ClockTab');
  if (manualMode) {
    return <ManualInput label={manualLabel} onConfirm={onClock} onCancel={onCancelManual} />;
  }
  const Icon = CLOCK_BUTTON_ICON[kind];
  return (
    <>
      {canClockNow && (
        <button onClick={() => onClock()}
          className={`flex items-center gap-2 border px-8 py-3 rounded-xl font-semibold text-base ${CLOCK_BUTTON_TONE[kind]}`}>
          <Icon size={18} fill="currentColor" aria-hidden />
          {label}
        </button>
      )}
      <button onClick={onOpenManual} className={canClockNow ? MANUAL_LINK_CLASS : MANUAL_BUTTON_CLASS}>
        {t('enterManually')}
      </button>
    </>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ClockTab({ date, onDateChange, headerAction }: ClockTabProps) {
  const t = useTranslations('ClockTab');
  const locale = useLocale();
  const { punches, note, leaveType, isLoading, error, clockIn, clockOut, deletePunches, restorePunches, editPunch, saveNote, setLeave } = useClockDay(date);
  const { settings } = useSettings();
  const { used: vacationUsed, refresh: refreshVacation } = useVacationUsage(parseInt(date.slice(0, 4)));
  const { showToast } = useToast();
  const formatError = useErrorMessage();
  const [now, setNow] = useState(new Date());
  const [manualMode, setManualMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [noteValue, setNoteValue] = useState(note);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const today = localDateStr(new Date());
  const isToday = date === today;

  // Ticker — only runs for today. Aligned on the wall-clock minute so the
  // displayed time never lags up to 59s behind the real clock.
  useEffect(() => {
    if (!isToday) return;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(new Date());
    tick();
    const alignId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60_000);
    }, msUntilNextMinute(new Date()));
    return () => {
      clearTimeout(alignId);
      clearInterval(intervalId);
    };
  }, [isToday]);

  // Sync note from hook
  useEffect(() => { setNoteValue(note); }, [note]);

  // Close picker on outside click, or on Escape (returning focus to its trigger)
  useEffect(() => {
    if (!showPicker) return;
    function handleMouseDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setShowPicker(false);
      pickerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPicker]);

  const dayCalc = settings ? calculateFromPunches(punches, settings, now, date, leaveType) : null;
  const lastType = dayCalc?.lastPunchType ?? null;
  const expectedMinutes = (settings?.expectedHoursPerDay ?? 8) * 60;
  const progressPct = dayCalc ? Math.min(100, (dayCalc.workedMinutes / expectedMinutes) * 100) : 0;
  const AbsenceIcon = leaveType !== null ? LEAVE_ICON[leaveType] : ABSENCE_ICON;
  const isOnBreak = dayCalc?.status !== 'complete' && isToday;
  const projectedEndTime = isToday ? dayCalc?.projectedEndTime ?? null : null;
  const manualProps = {
    manualMode,
    onOpenManual: () => setManualMode(true),
    onCancelManual: () => setManualMode(false),
  };

  // Delete immediately and offer an undo: forgiving, and one tap fewer than a confirm.
  async function handleDeletePunches(ids: string[]) {
    try {
      const deleted = await deletePunches(ids);
      showToast(t('toastDeleted'), 'info', {
        action: {
          label: t('undo'),
          onClick: async () => {
            try {
              await restorePunches(deleted);
              showToast(t('toastRestored'), 'success');
            } catch (e) { showToast(formatError(e), 'error'); }
          },
        },
      });
    } catch (e) { showToast(formatError(e), 'error'); }
  }

  async function handleClockIn(manualTime?: string) {
    try {
      await clockIn(manualTime);
      setManualMode(false);
      showToast(t('toastClockIn'), 'success');
    } catch (e) { showToast(formatError(e), 'error'); }
  }

  async function handleClockOut(manualTime?: string) {
    try {
      await clockOut(manualTime);
      setManualMode(false);
      showToast(t('toastClockOut'), 'info');
    } catch (e) { showToast(formatError(e), 'error'); }
  }

  function handleNoteChange(v: string) {
    setNoteValue(v);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveNote(v), 1000);
  }

  async function handleLeaveSave(type: LeaveType | null, comment: string) {
    // The "other" comment lives in the day note; clear it when leaving that type
    // so it doesn't linger in the notes area after switching or removing the absence.
    const wasOther = leaveType === 'other';
    await setLeave(type);
    if (type === 'other') {
      await saveNote(comment);
    } else if (wasOther) {
      await saveNote('');
    }
    refreshVacation();
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col gap-5">
      {/* Date header — the date and its prev/next arrows act on the same thing, so they
          are grouped; day-level actions sit beside them and wrap below on narrow screens. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* basis-64 keeps the full date readable: actions wrap below instead of truncating it */}
        <div className="flex items-center grow basis-64 min-w-0">
          <div className="relative min-w-0" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(s => !s)}
              aria-haspopup="dialog"
              aria-expanded={showPicker}
              className="flex items-center gap-2 min-h-11 max-w-full hover:bg-text/5 rounded-xl px-2 py-1 text-left"
            >
              <Calendar size={24} aria-hidden className="flex-none" />
              <div className="min-w-0">
                {isToday && <p className="text-xs font-semibold text-primary leading-none mb-0.5 capitalize">{t('today')}</p>}
                <p className="font-bold text-base leading-tight capitalize truncate">{dateLabel}</p>
              </div>
            </button>
            {showPicker && (
              <DatePickerPopup current={date} onSelect={onDateChange} onClose={() => setShowPicker(false)} />
            )}
          </div>
          <button onClick={() => onDateChange(shiftDate(date, -1))} aria-label={t('previousDay')} className={DAY_NAV_BUTTON_CLASS}>
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button onClick={() => onDateChange(shiftDate(date, 1))} aria-label={t('nextDay')} className={DAY_NAV_BUTTON_CLASS}>
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {!isToday && (
            <button onClick={() => onDateChange(today)}
              className={`${CHIP_HIT_AREA_CLASS} text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 hover:bg-primary/8`}>
              {t('backToToday')}
            </button>
          )}
          {dayCalc && (leaveType !== null || dayCalc.workedMinutes < expectedMinutes) && (
            <button
              onClick={() => setShowLeaveModal(true)}
              aria-haspopup="dialog"
              className={`${CHIP_HIT_AREA_CLASS} flex items-center gap-1.5 rounded-lg border px-3 ${leaveType !== null ? 'border-tertiary/30 bg-tertiary/10' : 'border-text/15 text-text/70 hover:bg-text/5'}`}
            >
              <AbsenceIcon size={13} aria-hidden className={leaveType !== null ? 'text-tertiary' : 'text-text/55'} />
              <span className={`text-xs font-medium whitespace-nowrap ${leaveType !== null ? 'text-tertiary' : 'text-text/70'}`}>
                {leaveType !== null ? t(LEAVE_LABEL_KEY[leaveType]) : t('absence')}
              </span>
            </button>
          )}
          {headerAction}
        </div>
      </div>

      {/* Error */}
      {error != null && (
        <p role="alert" className="text-sm text-secondary bg-secondary/10 rounded-xl px-4 py-2">
          {formatError(error)}
        </p>
      )}

      {/* Clock section */}
      {isLoading ? (
        <div className="h-36 rounded-xl bg-text/5 animate-pulse" />
      ) : (
        <div className="rounded-xl border border-text/10 bg-background p-6 flex flex-col items-center gap-4 text-center">

          {/* Leave day — no punches */}
          {punches.length === 0 && leaveType !== null && dayCalc && (
            <>
              <div>
                <AbsenceIcon size={30} aria-hidden className="block mx-auto mb-2 text-tertiary" />
                <p className="text-2xl font-bold text-tertiary">{t(LEAVE_LABEL_KEY[leaveType])}</p>
                <p className="text-sm text-text/50 mt-1">
                  {leaveType === 'other' && note ? note : t(LEAVE_DESC_KEY[leaveType])}
                </p>
              </div>
              <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} size="lg" />
              <ClockActions {...manualProps} kind="in" label={t('clockIn')} manualLabel={t('clockInAt')} canClockNow={false} onClock={handleClockIn} />
            </>
          )}

          {/* No punches yet */}
          {punches.length === 0 && leaveType === null && (
            <>
              <p className="text-sm text-text-muted">
                {t('noEntries')}{isToday ? `, ${t('noEntriesHint')}` : ''}
              </p>
              <ClockActions {...manualProps} kind="in" label={t('clockIn')} manualLabel={t('clockInAt')} canClockNow={isToday} onClock={handleClockIn} />
            </>
          )}

          {/* Currently working */}
          {punches.length > 0 && lastType === 'in' && (
            <>
              <p className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                <Briefcase size={20} aria-hidden />
                {dayCalc ? formatMinutes(dayCalc.workedMinutes) : '–'}
              </p>
              <DayProgress progressPct={progressPct} isPaused={false} startTime={punches[0].time} endTime={projectedEndTime} />
              <ClockActions {...manualProps} kind="out" label={t('clockOut')} manualLabel={t('clockOutAt')} canClockNow={isToday} onClock={handleClockOut} />
            </>
          )}

          {/* On break (today, day not complete yet) */}
          {punches.length > 0 && lastType === 'out' && dayCalc && isOnBreak && (
            <>
              <p className="text-lg font-semibold text-text-muted flex items-center justify-center gap-2">
                <Coffee size={20} aria-hidden />
                {formatMinutes(dayCalc.liveBreakMinutes)}
              </p>
              <DayProgress progressPct={progressPct} isPaused startTime={punches[0].time} endTime={projectedEndTime} />
              <ClockActions {...manualProps} kind="in" label={t('clockIn')} manualLabel={t('clockInAt')} canClockNow={isToday} onClock={handleClockIn} />
            </>
          )}

          {/* Day complete, or a past day that ended clocked out */}
          {punches.length > 0 && lastType === 'out' && dayCalc && !isOnBreak && (
            <>
              {/* The only "delight" moment: a soft entrance when today's work is done.
                  Not on past days, which users browse often. */}
              <div className={isToday ? 'enter-soft' : undefined}>
                <p className="text-2xl font-bold text-primary">{t('dayComplete')}</p>
                <p className="text-sm text-text/50 mt-1">{formatMinutes(dayCalc.workedMinutes)} {t('workedSuffix')}</p>
              </div>
              <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} size="lg" />
              <ClockActions {...manualProps} kind="in" label={t('clockInAgain')} manualLabel={t('clockInAt')} canClockNow={isToday} onClock={handleClockIn} />
            </>
          )}
        </div>
      )}

      {/* Punch timeline + summary */}
      {punches.length > 0 && (
        <div className="flex flex-wrap gap-6 items-start">
          {dayCalc && (
            <div className="flex-1 min-w-44 rounded-xl border border-text/10 bg-background divide-y divide-text/8 text-sm">
              {[
                { label: t('summaryWorked'), value: formatMinutes(dayCalc.workedMinutes) },
                {
                  label: t('summaryBreak'),
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      {formatMinutes(dayCalc.breakMinutes)}
                      {dayCalc.breakMinutes > 0 && (dayCalc.isBreakSufficient
                        ? <Check size={14} role="img" aria-label={t('breakSufficient')} className="text-primary" />
                        : <TriangleAlert size={14} role="img" aria-label={t('breakInsufficient')} className="text-tertiary" />)}
                    </span>
                  ),
                },
                { label: t('summaryBalance'), value: <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} /> },
                { label: t('summaryExpected'), value: formatMinutes((settings?.expectedHoursPerDay ?? 8) * 60) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="font-semibold tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 min-w-full sm:min-w-44 rounded-xl border border-text/10 divide-y divide-text/8">
            <PunchTimeline
              punches={punches}
              onDelete={handleDeletePunches}
              onEdit={async (id, newTime) => {
                try {
                  await editPunch(id, newTime);
                  showToast(t('toastEdited'), 'success');
                } catch (e) {
                  showToast(formatError(e), 'error');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Note */}
      <div className="flex flex-col gap-1">
        <label htmlFor="day-note" className="text-xs font-medium text-text/50">{t('noteLabel')}</label>
        <textarea
          id="day-note"
          value={noteValue}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder={t('notePlaceholder')}
          rows={2}
          className="w-full rounded-xl border border-text/10 bg-background px-3 py-2 text-sm placeholder:text-text/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
        />
      </div>

      <LeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        current={leaveType}
        note={note}
        vacationUsed={vacationUsed}
        vacationTotal={settings?.annualVacationDays ?? 0}
        onSave={handleLeaveSave}
      />
    </div>
  );
}
