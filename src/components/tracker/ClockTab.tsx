'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useClockDay } from '@/lib/hooks/useClockDay';
import { useSettings } from '@/lib/hooks/useSettings';
import {
  calculateFromPunches,
  formatMinutes,
  localDateStr,
} from '@/lib/business/calculations';
import { useToast } from '@/components/ui/Toast';
import BalanceDisplay from '@/components/ui/BalanceDisplay';
import type { Punch } from '@/lib/types';

interface ClockTabProps {
  date: string;
  onDateChange: (date: string) => void;
}

function shiftDate(d: string, delta: number): string {
  const date = new Date(d + 'T00:00:00');
  date.setDate(date.getDate() + delta);
  return localDateStr(date);
}

// ── Punch timeline ──────────────────────────────────────────────────────────

type PunchAction =
  | { kind: 'confirmDeletePair'; inId: string; outId: string | null }
  | { kind: 'edit'; id: string; value: string }
  | null;

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


const TrashIcon = () => (
  <svg width="16" height="16" className="sm:w-3 sm:h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <polyline points="2 4 4 4 14 4" /><path d="M5 4V2h6v2" /><path d="M6 7v5M10 7v5" /><rect x="3" y="4" width="10" height="10" rx="1" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="flex-none text-text/25">
    <line x1="2" y1="8" x2="14" y2="8" /><polyline points="10 4 14 8 10 12" />
  </svg>
);

function PunchTimeline({
  punches,
  onDelete,
  onEdit,
}: {
  punches: Punch[];
  onDelete: (id: string) => void;
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
        const isDeletingPair = action?.kind === 'confirmDeletePair' && action.inId === inPunch.id;
        const editValue = action?.kind === 'edit' ? action.value : '';

        return (
          <Fragment key={inPunch.id}>
            {/* Break separator before this pair */}
            {breakMins !== null && (
              <div className="flex items-center gap-3 px-3 py-0.5" aria-hidden>
                <div className="flex-none w-2 flex justify-center">
                  <div className="w-px h-4 bg-text/15" />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-text/35">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
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
                  <span className="text-sm font-mono font-semibold text-primary">{inPunch.time}</span>
                )}
                <ArrowIcon />
                {isEditingOut && outPunch ? (
                  <input type="time" value={editValue}
                    onChange={e => setAction({ kind: 'edit', id: outPunch.id, value: e.target.value })}
                    className={inputClass} autoFocus />
                ) : outPunch ? (
                  <span className="text-sm font-mono font-semibold text-secondary">{outPunch.time}</span>
                ) : (
                  <span className="text-sm text-text/30">…</span>
                )}
                <button
                  onClick={async () => {
                    if (!editValue) return;
                    await onEdit(isEditingIn ? inPunch.id : outPunch!.id, editValue);
                    setAction(null);
                  }}
                  disabled={!editValue}
                  className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity ml-1"
                >
                  {t('confirm')}
                </button>
                <button onClick={() => setAction(null)} className="text-xs text-text/40 hover:text-text/70 transition-colors">
                  {t('editCancel')}
                </button>
              </div>
            ) : (
              /* Pair row — normal (delete confirm inline) */
              <div role="listitem" className="flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-2 min-h-14 sm:min-h-12 rounded-xl hover:bg-text/4 group">
                <span className="flex-none w-2 h-2 rounded-full bg-primary" aria-hidden />
                <button
                  onClick={() => setAction({ kind: 'edit', id: inPunch.id, value: inPunch.time })}
                  aria-label={t('editPunchLabel', { time: inPunch.time })}
                  className="text-sm font-mono font-semibold text-primary hover:underline underline-offset-2 decoration-primary/40"
                >
                  {inPunch.time}
                </button>
                <ArrowIcon />
                {outPunch ? (
                  <button
                    onClick={() => setAction({ kind: 'edit', id: outPunch.id, value: outPunch.time })}
                    aria-label={t('editPunchLabel', { time: outPunch.time })}
                    className="text-sm font-mono font-semibold text-secondary hover:underline underline-offset-2 decoration-secondary/40"
                  >
                    {outPunch.time}
                  </button>
                ) : (
                  <span className="text-sm text-text/30">…</span>
                )}
                {durationMins !== null && (
                  <>
                    <span className="text-sm text-text/30 select-none" aria-hidden>:</span>
                    <span className="text-sm font-semibold tabular-nums font-mono">{formatMinutes(durationMins)}</span>
                  </>
                )}
                <span className="flex-1" />
                {isDeletingPair ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => {
                        onDelete(inPunch.id);
                        if (outPunch) onDelete(outPunch.id);
                        setAction(null);
                      }}
                      className="text-secondary font-medium hover:underline"
                    >
                      {t('delete')}
                    </button>
                    <button onClick={() => setAction(null)} className="text-text/40 hover:text-text/60">
                      {t('deleteCancel')}
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setAction({ kind: 'confirmDeletePair', inId: inPunch.id, outId: outPunch?.id ?? null })}
                    aria-label={t('deletePunchLabel', { time: inPunch.time })}
                    className="p-2 sm:p-1 rounded hover:bg-text/8 text-text/30 hover:text-secondary transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <TrashIcon />
                  </button>
                )}
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
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-sm text-text/60 whitespace-nowrap">{label}</label>
      <input type="time" value={value} onChange={e => setValue(e.target.value)}
        className="rounded-lg border border-text/15 bg-background px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:[&::-webkit-calendar-picker-indicator]:invert"
        autoFocus
      />
      <button onClick={() => value && onConfirm(value)}
        disabled={!value}
        className="px-3 py-1 bg-primary text-white text-sm rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {t('confirm')}
      </button>
      <button onClick={onCancel} className="text-sm text-text/40 hover:text-text/70 transition-colors">{t('cancel')}</button>
    </div>
  );
}

// ── Mini date picker ─────────────────────────────────────────────────────────

function DatePickerPopup({ current, onSelect, onClose }: { current: string; onSelect: (d: string) => void; onClose: () => void }) {
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
    <div className="absolute top-full left-0 z-50 mt-2 bg-background border border-text/15 rounded-xl shadow-xl p-3 w-64" role="dialog">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevM} className="p-1 rounded hover:bg-text/8" aria-label="←">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="10 4 6 8 10 12" /></svg>
        </button>
        <span className="text-sm font-semibold">{MONTHS[viewMonth - 1]} {viewYear}</span>
        <button onClick={nextM} className="p-1 rounded hover:bg-text/8" aria-label="→">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="6 4 10 8 6 12" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-text/40 font-medium py-0.5">{d}</div>
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
              className={`aspect-square rounded-lg text-xs font-medium transition-colors ${isSelected ? 'bg-primary text-white' : isToday ? 'ring-1 ring-primary text-primary' : 'hover:bg-text/8'}`}
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
            className="flex-1 h-12 rounded-sm bg-primary"
            style={{
              backgroundImage: isPaused ? PAUSE_HATCH : undefined,
              opacity: isPartial && isPaused ? 0.45 : undefined,
              animation: isPartial && !isPaused ? 'segment-pulse 1.4s ease-in-out infinite' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ClockTab({ date, onDateChange }: ClockTabProps) {
  const t = useTranslations('ClockTab');
  const locale = useLocale();
  const { punches, note, vacationMinutes, isLoading, error, clockIn, clockOut, deletePunch, editPunch, saveNote, setVacation } = useClockDay(date);
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [now, setNow] = useState(new Date());
  const [manualMode, setManualMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [noteValue, setNoteValue] = useState(note);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const today = localDateStr(new Date());
  const isToday = date === today;

  // Ticker — only runs for today; minute precision is enough for the progress bar
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [isToday]);

  // Sync note from hook
  useEffect(() => { setNoteValue(note); }, [note]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    function handle(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showPicker]);

  const dayCalc = settings ? calculateFromPunches(punches, settings, now, date, vacationMinutes) : null;
  const lastType = dayCalc?.lastPunchType ?? null;
  const expectedMinutes = (settings?.expectedHoursPerDay ?? 8) * 60;
  const progressPct = dayCalc ? Math.min(100, (dayCalc.workedMinutes / expectedMinutes) * 100) : 0;

  async function handleClockIn(manualTime?: string) {
    try {
      await clockIn(manualTime);
      setManualMode(false);
      showToast(t('toastClockIn'), 'success');
    } catch (e) { showToast(String(e).replace('Error: ', ''), 'error'); }
  }

  async function handleClockOut(manualTime?: string) {
    try {
      await clockOut(manualTime);
      setManualMode(false);
      showToast(t('toastClockOut'), 'info');
    } catch (e) { showToast(String(e).replace('Error: ', ''), 'error'); }
  }

  function handleNoteChange(v: string) {
    setNoteValue(v);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveNote(v), 1000);
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col gap-5">
      {/* Date header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1" ref={pickerRef}>
          <button
            onClick={() => setShowPicker(s => !s)}
            className="flex items-center gap-2 hover:bg-text/5 rounded-xl px-2 py-1 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              {isToday && <p className="text-xs font-semibold text-primary leading-none mb-0.5 capitalize text-left">{t('today')}</p>}
              <p className="font-bold text-base leading-none capitalize">{dateLabel}</p>
            </div>
          </button>
          {showPicker && (
            <DatePickerPopup current={date} onSelect={onDateChange} onClose={() => setShowPicker(false)} />
          )}
        </div>
        {!isToday && (
          <button onClick={() => onDateChange(today)}
            className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/8 transition-colors">
            {t('backToToday')}
          </button>
        )}
        {dayCalc && dayCalc.workedMinutes < expectedMinutes && (
          <button
            role="switch"
            aria-checked={vacationMinutes > 0}
            onClick={() => setVacation(vacationMinutes > 0 ? 0 : (settings?.expectedHoursPerDay ?? 8) * 60)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${vacationMinutes > 0 ? 'bg-tertiary/10' : 'hover:bg-text/5'}`}
          >
            <span className={`text-xs font-medium whitespace-nowrap ${vacationMinutes > 0 ? 'text-tertiary' : 'text-text/35'}`}>
              {t('vacation')}
            </span>
            <div className={`relative w-8 h-4.5 rounded-full transition-colors ${vacationMinutes > 0 ? 'bg-tertiary' : 'bg-text/15'}`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${vacationMinutes > 0 ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        )}
        <div className="flex gap-1">
          <button onClick={() => onDateChange(shiftDate(date, -1))} aria-label="←" className="p-2 rounded-lg hover:bg-text/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="10 4 6 8 10 12" /></svg>
          </button>
          <button onClick={() => onDateChange(shiftDate(date, 1))} aria-label="→" className="p-2 rounded-lg hover:bg-text/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="6 4 10 8 6 12" /></svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-secondary bg-secondary/10 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {/* Clock section */}
      {isLoading ? (
        <div className="h-36 rounded-xl bg-text/5 animate-pulse" />
      ) : (
        <div className="rounded-xl border border-text/10 bg-background p-6 flex flex-col items-center gap-4 text-center">

          {/* Vacation day — no punches */}
          {punches.length === 0 && dayCalc?.status === 'vacation' && (
            <>
              <div>
                <p className="text-2xl font-bold text-tertiary">{t('vacation')}</p>
                <p className="text-sm text-text/50 mt-1">{t('vacationDesc')}</p>
              </div>
              <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} size="lg" />
              {!manualMode ? (
                <button onClick={() => setManualMode(true)} className="text-sm text-text/40 hover:text-text/70 transition-colors">
                  {t('enterManually')}
                </button>
              ) : (
                <ManualInput label={t('clockInAt')} onConfirm={handleClockIn} onCancel={() => setManualMode(false)} />
              )}
            </>
          )}

          {/* No punches yet */}
          {punches.length === 0 && dayCalc?.status !== 'vacation' && (
            <>
              <p className="text-sm text-text/40">
                {t('noEntries')}{isToday ? `, ${t('noEntriesHint')}` : ''}
              </p>
              {!manualMode && (
                <>
                  {isToday ? (
                    <button onClick={() => handleClockIn()}
                      className="flex items-center gap-2 border border-primary bg-primary/10 text-primary px-8 py-3 rounded-xl font-semibold text-base hover:bg-primary/20 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      {t('clockIn')}
                    </button>
                  ) : null}
                  <button onClick={() => setManualMode(true)} className={isToday ? "text-sm text-text/40 hover:text-text/70 transition-colors" : "border border-text/20 text-text/60 px-8 py-3 rounded-xl font-semibold text-base hover:bg-text/5 transition-colors"}>
                    {t('enterManually')}
                  </button>
                </>
              )}
              {manualMode && (
                <ManualInput label={t('clockInAt')} onConfirm={handleClockIn} onCancel={() => setManualMode(false)} />
              )}
            </>
          )}

          {/* Currently working */}
          {punches.length > 0 && lastType === 'in' && (
            <>
              <p className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                {dayCalc ? formatMinutes(dayCalc.workedMinutes) : '–'}
              </p>
              <div className="w-full flex flex-col gap-1.5">
                <SegmentedProgressBar progressPct={progressPct} isPaused={false} />
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-text/50 tabular-nums">{punches[0].time}</span>
                  {dayCalc?.projectedEndTime && isToday && (
                    <span className="text-xs font-semibold text-text/50 tabular-nums">{dayCalc.projectedEndTime}</span>
                  )}
                </div>
              </div>
              {!manualMode && (
                <>
                  {isToday ? (
                    <button onClick={() => handleClockOut()}
                      className="flex items-center gap-2 border border-secondary bg-secondary/10 text-secondary px-8 py-3 rounded-xl font-semibold text-base hover:bg-secondary/20 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                      {t('clockOut')}
                    </button>
                  ) : null}
                  <button onClick={() => setManualMode(true)} className={isToday ? "text-sm text-text/40 hover:text-text/70 transition-colors" : "border border-text/20 text-text/60 px-8 py-3 rounded-xl font-semibold text-base hover:bg-text/5 transition-colors"}>
                    {t('enterManually')}
                  </button>
                </>
              )}
              {manualMode && (
                <ManualInput label={t('clockOutAt')} onConfirm={handleClockOut} onCancel={() => setManualMode(false)} />
              )}
            </>
          )}

          {/* On break or day complete */}
          {punches.length > 0 && lastType === 'out' && dayCalc && (
            <>
              {dayCalc.status !== 'complete' ? (
                <>
                  <p className="text-lg font-semibold text-text/35 flex items-center justify-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                      <line x1="6" y1="2" x2="6" y2="4" />
                      <line x1="10" y1="2" x2="10" y2="4" />
                      <line x1="14" y1="2" x2="14" y2="4" />
                    </svg>
                    {formatMinutes(dayCalc.liveBreakMinutes)}
                  </p>
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <SegmentedProgressBar progressPct={progressPct} isPaused={true} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold text-text/50 tabular-nums">{punches[0].time}</span>
                      {dayCalc?.projectedEndTime && isToday && (
                        <span className="text-xs font-semibold text-text/50 tabular-nums">{dayCalc.projectedEndTime}</span>
                      )}
                    </div>
                  </div>
                  {!manualMode && (
                    <>
                      {isToday ? (
                        <button onClick={() => handleClockIn()}
                          className="flex items-center gap-2 border border-primary bg-primary/10 text-primary px-8 py-3 rounded-xl font-semibold text-base hover:bg-primary/20 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          {t('clockIn')}
                        </button>
                      ) : null}
                      <button onClick={() => setManualMode(true)} className="text-sm text-text/40 hover:text-text/70 transition-colors">
                        {t('enterManually')}
                      </button>
                    </>
                  )}
                  {manualMode && (
                    <ManualInput label={t('clockInAt')} onConfirm={handleClockIn} onCancel={() => setManualMode(false)} />
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-2xl font-bold text-primary">{t('dayComplete')}</p>
                    <p className="text-sm text-text/50 mt-1">{formatMinutes(dayCalc.workedMinutes)} {t('workedSuffix')}</p>
                  </div>
                  <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} size="lg" />
                  {!manualMode ? (
                    <>
                      {isToday ? (
                        <button onClick={() => handleClockIn()}
                          className="flex items-center gap-2 border border-primary bg-primary/10 text-primary px-8 py-3 rounded-xl font-semibold text-base hover:bg-primary/20 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          {t('clockInAgain')}
                        </button>
                      ) : null}
                      <button onClick={() => setManualMode(true)} className="text-sm text-text/40 hover:text-text/70 transition-colors">
                        {t('enterManually')}
                      </button>
                    </>
                  ) : (
                    <ManualInput label={t('clockInAt')} onConfirm={handleClockIn} onCancel={() => setManualMode(false)} />
                  )}
                </>
              )}
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
                { label: t('summaryBreak'), value: `${formatMinutes(dayCalc.breakMinutes)} ${dayCalc.breakMinutes > 0 ? (dayCalc.isBreakSufficient ? '✓' : '⚠') : ''}` },
                { label: t('summaryBalance'), value: <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} />, isReact: true },
                { label: t('summaryExpected'), value: formatMinutes((settings?.expectedHoursPerDay ?? 8) * 60) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-text/50">{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 min-w-full sm:min-w-44 rounded-xl border border-text/10 divide-y divide-text/8">
            <PunchTimeline
              punches={punches}
              onDelete={deletePunch}
              onEdit={async (id, newTime) => {
                try {
                  await editPunch(id, newTime);
                  showToast(t('toastEdited'), 'success');
                } catch (e) {
                  showToast(String(e).replace('Error: ', ''), 'error');
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
          className="w-full rounded-xl border border-text/10 bg-background px-3 py-2 text-sm placeholder:text-text/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-none"
        />
      </div>
    </div>
  );
}
