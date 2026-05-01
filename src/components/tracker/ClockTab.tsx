'use client';

import { useState, useEffect, useRef } from 'react';
import { useClockDay } from '@/lib/hooks/useClockDay';
import { useSettings } from '@/lib/hooks/useSettings';
import {
  calculateFromPunches,
  formatDuration,
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

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  return `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

function timeToSeconds(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + m * 60;
}

// ── Punch timeline ──────────────────────────────────────────────────────────

function PunchTimeline({ punches, onDelete }: { punches: Punch[]; onDelete: (id: string) => void }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (punches.length === 0) return null;

  return (
    <div className="flex flex-col gap-1" role="list" aria-label="Punch timeline">
      {punches.map((punch, idx) => {
        const prev = punches[idx - 1];
        let duration: string | null = null;
        if (prev) {
          const mins = (parseInt(punch.time.split(':')[0]) * 60 + parseInt(punch.time.split(':')[1])) -
                       (parseInt(prev.time.split(':')[0]) * 60 + parseInt(prev.time.split(':')[1]));
          duration = formatDuration(mins);
        }
        const isIn = punch.type === 'in';

        return (
          <div key={punch.id} role="listitem" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/4 group">
            <span className={`flex-none w-2 h-2 rounded-full ${isIn ? 'bg-green-500' : 'bg-red-400'}`} aria-hidden />
            <span className={`text-sm font-mono font-semibold ${isIn ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {punch.time}
            </span>
            <span className="text-sm text-foreground/60 flex-1">
              {isIn ? 'Clock in' : 'Clock out'}
              {punch.isManual && <span className="text-xs text-foreground/30 ml-1">(manual)</span>}
              {duration && (
                <span className={`ml-1.5 text-xs font-medium ${isIn ? 'text-blue-500 dark:text-blue-400' : 'text-foreground/50'}`}>
                  · {isIn ? `break ${duration}` : `worked ${duration}`}
                </span>
              )}
            </span>
            {confirmId === punch.id ? (
              <span className="flex items-center gap-1.5 text-xs">
                <button onClick={() => { onDelete(punch.id); setConfirmId(null); }} className="text-red-500 font-medium hover:underline">Delete</button>
                <button onClick={() => setConfirmId(null)} className="text-foreground/40 hover:text-foreground/60">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmId(punch.id)} aria-label={`Delete punch at ${punch.time}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-foreground/8 text-foreground/30 hover:text-red-500">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <polyline points="2 4 4 4 14 4"/><path d="M5 4V2h6v2"/><path d="M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/>
                </svg>
              </button>
            )}
          </div>
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
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2 py-1">
      <label className="text-sm text-foreground/60 whitespace-nowrap">{label}</label>
      <input type="time" value={value} onChange={e => setValue(e.target.value)}
        className="rounded-lg border border-foreground/15 bg-background px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        autoFocus
      />
      <button onClick={() => value && onConfirm(value)}
        disabled={!value}
        className="px-3 py-1 bg-accent text-white text-sm rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        Confirm
      </button>
      <button onClick={onCancel} className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors">Cancel</button>
    </div>
  );
}

// ── Mini date picker ─────────────────────────────────────────────────────────

function DatePickerPopup({ current, onSelect, onClose }: { current: string; onSelect: (d: string) => void; onClose: () => void }) {
  const [viewYear, setViewYear] = useState(() => parseInt(current.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(current.slice(5, 7)));
  const today = localDateStr(new Date());
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const firstDow = new Date(`${viewYear}-${String(viewMonth).padStart(2,'0')}-01T00:00:00`).getDay();
  const pad = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  function prevM() { if (viewMonth === 1) { setViewYear(y => y-1); setViewMonth(12); } else setViewMonth(m => m-1); }
  function nextM() { if (viewMonth === 12) { setViewYear(y => y+1); setViewMonth(1); } else setViewMonth(m => m+1); }

  return (
    <div className="absolute top-full left-0 z-50 mt-2 bg-background border border-foreground/15 rounded-xl shadow-xl p-3 w-64" role="dialog" aria-label="Select date">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevM} className="p-1 rounded hover:bg-foreground/8" aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="10 4 6 8 10 12"/></svg>
        </button>
        <span className="text-sm font-semibold">{MONTHS[viewMonth-1]} {viewYear}</span>
        <button onClick={nextM} className="p-1 rounded hover:bg-foreground/8" aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="6 4 10 8 6 12"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} className="text-center text-[10px] text-foreground/40 font-medium py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({length: pad}).map((_,i) => <div key={`e${i}`}/>)}
        {Array.from({length: daysInMonth}).map((_,i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isSelected = dateStr === current;
          const isToday = dateStr === today;
          return (
            <button key={day} onClick={() => { onSelect(dateStr); onClose(); }}
              className={`aspect-square rounded-lg text-xs font-medium transition-colors ${isSelected ? 'bg-accent text-white' : isToday ? 'ring-1 ring-accent text-accent' : 'hover:bg-foreground/8'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ClockTab({ date, onDateChange }: ClockTabProps) {
  const { punches, note, isLoading, error, clockIn, clockOut, deletePunch, saveNote } = useClockDay(date);
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

  // Ticker
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const dayCalc = settings ? calculateFromPunches(punches, settings, now, date) : null;
  const lastType = dayCalc?.lastPunchType ?? null;

  // Elapsed time since last punch (in seconds)
  const elapsedSeconds = (() => {
    if (!punches.length) return 0;
    const last = punches[punches.length - 1];
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return Math.max(0, nowSecs - timeToSeconds(last.time));
  })();

  async function handleClockIn(manualTime?: string) {
    try {
      await clockIn(manualTime);
      setManualMode(false);
      showToast('Clocked in', 'success');
    } catch (e) { showToast(String(e).replace('Error: ', ''), 'error'); }
  }

  async function handleClockOut(manualTime?: string) {
    try {
      await clockOut(manualTime);
      setManualMode(false);
      showToast('Clocked out', 'info');
    } catch (e) { showToast(String(e).replace('Error: ', ''), 'error'); }
  }

  function handleNoteChange(v: string) {
    setNoteValue(v);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveNote(v), 1000);
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col gap-5">
      {/* Date header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1" ref={pickerRef}>
          <button
            onClick={() => setShowPicker(s => !s)}
            className="flex items-center gap-2 hover:bg-foreground/5 rounded-xl px-2 py-1 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div>
              {isToday && <p className="text-xs font-semibold text-accent leading-none mb-0.5">Today</p>}
              <p className="font-bold text-base leading-none">{dateLabel}</p>
            </div>
          </button>
          {showPicker && (
            <DatePickerPopup current={date} onSelect={onDateChange} onClose={() => setShowPicker(false)} />
          )}
        </div>
        {!isToday && (
          <button onClick={() => onDateChange(today)}
            className="text-xs font-medium text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/8 transition-colors">
            Back to today
          </button>
        )}
        <div className="flex gap-1">
          <button onClick={() => onDateChange(shiftDate(date, -1))} aria-label="Previous day" className="p-2 rounded-lg hover:bg-foreground/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="10 4 6 8 10 12"/></svg>
          </button>
          <button onClick={() => onDateChange(shiftDate(date, 1))} aria-label="Next day" className="p-2 rounded-lg hover:bg-foreground/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><polyline points="6 4 10 8 6 12"/></svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      {/* Clock section */}
      {isLoading ? (
        <div className="h-48 rounded-xl bg-foreground/5 animate-pulse" />
      ) : (
        <div className="rounded-xl border border-foreground/10 p-6 flex flex-col items-center gap-4 text-center">
          {punches.length === 0 && (
            <>
              <p className="text-5xl font-mono font-bold tabular-nums tracking-tight" aria-live="polite" aria-label="Current time">
                {formatClock(now)}
              </p>
              <p className="text-sm text-foreground/40">No entries yet{isToday ? ' — clock in to start' : ''}</p>
              {isToday && !manualMode && (
                <>
                  <button onClick={() => handleClockIn()}
                    className="flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Clock In
                  </button>
                  <button onClick={() => setManualMode(true)} className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors">
                    Enter time manually
                  </button>
                </>
              )}
              {isToday && manualMode && (
                <ManualInput label="Clock in at" onConfirm={handleClockIn} onCancel={() => setManualMode(false)} />
              )}
            </>
          )}

          {punches.length > 0 && lastType === 'in' && (
            <>
              <div>
                <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Currently working</p>
                <p className="text-4xl font-mono font-bold tabular-nums" aria-live="polite" aria-atomic="true">
                  {formatElapsed(elapsedSeconds)}
                </p>
              </div>
              {dayCalc?.projectedEndTime && (
                <p className="text-sm text-foreground/50">
                  Expected end: <span className="font-semibold text-foreground">{dayCalc.projectedEndTime}</span>
                </p>
              )}
              {dayCalc && (
                <span className="text-sm text-foreground/50 flex items-center gap-1">
                  Balance: <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} />
                </span>
              )}
              {!manualMode && (
                <>
                  <button onClick={() => handleClockOut()}
                    className="flex items-center gap-2 bg-red-500 text-white px-8 py-3 rounded-xl font-semibold text-base hover:bg-red-600 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                    Clock Out
                  </button>
                  <button onClick={() => setManualMode(true)} className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors">
                    Enter time manually
                  </button>
                </>
              )}
              {manualMode && (
                <ManualInput label="Clock out at" onConfirm={handleClockOut} onCancel={() => setManualMode(false)} />
              )}
            </>
          )}

          {punches.length > 0 && lastType === 'out' && dayCalc && (
            <>
              {dayCalc.status !== 'complete' ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">On break</p>
                    <p className="text-4xl font-mono font-bold tabular-nums" aria-live="polite" aria-atomic="true">
                      {formatElapsed(elapsedSeconds)}
                    </p>
                  </div>
                  {!manualMode && (
                    <>
                      <button onClick={() => handleClockIn()}
                        className="flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Clock In
                      </button>
                      <button onClick={() => setManualMode(true)} className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors">
                        Enter time manually
                      </button>
                    </>
                  )}
                  {manualMode && (
                    <ManualInput label="Clock in at" onConfirm={handleClockIn} onCancel={() => setManualMode(false)} />
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">Day complete ✓</p>
                    <p className="text-sm text-foreground/50 mt-1">{formatMinutes(dayCalc.workedMinutes)} worked</p>
                  </div>
                  <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} size="lg" />
                  <button onClick={() => handleClockIn()}
                    className="text-sm font-medium text-foreground/50 border border-foreground/15 rounded-lg px-4 py-2 hover:bg-foreground/5 transition-colors">
                    Clock in again
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Punch timeline + summary */}
      {punches.length > 0 && (
        <div className="flex flex-col gap-3">
          <PunchTimeline punches={punches} onDelete={deletePunch} />

          {dayCalc && (
            <div className="rounded-xl border border-foreground/10 divide-y divide-foreground/8 text-sm">
              {[
                { label: 'Worked', value: formatMinutes(dayCalc.workedMinutes) },
                { label: 'Break', value: `${formatDuration(dayCalc.breakMinutes)} ${dayCalc.breakMinutes > 0 ? (dayCalc.isBreakSufficient ? '✓' : '⚠') : ''}` },
                { label: 'Balance', value: <BalanceDisplay balanceMinutes={dayCalc.balanceMinutes} />, isReact: true },
                { label: 'Expected', value: formatMinutes((settings?.expectedHoursPerDay ?? 8) * 60) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-foreground/50">{row.label}</span>
                  <span className="font-semibold">{row.isReact ? row.value : row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="flex flex-col gap-1">
        <label htmlFor="day-note" className="text-xs font-medium text-foreground/50">Note</label>
        <textarea
          id="day-note"
          value={noteValue}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder="Add a note for this day..."
          rows={2}
          className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2 text-sm placeholder:text-foreground/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 resize-none"
        />
      </div>
    </div>
  );
}
