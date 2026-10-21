'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSettings } from '@/lib/hooks/useSettings';
import { useVacationUsage } from '@/lib/hooks/useVacationUsage';

const SAVE_DEBOUNCE_MS = 500;
const SAVED_INDICATOR_MS = 2000;

interface SettingsPanelProps {
  onClose?: () => void;
}

export default function SettingsPanel({}: SettingsPanelProps) {
  const t = useTranslations('Settings');
  const locale = useLocale();
  const { settings, updateSettings } = useSettings();
  const { used: vacationUsed } = useVacationUsage(new Date().getFullYear());
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pendingPatch = useRef<Parameters<typeof updateSettings>[0]>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const expectedHoursId = useId();
  const minimumBreakId = useId();
  const vacationDaysId = useId();

  const [local, setLocal] = useState(settings);
  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  const DAYS = Array.from({ length: 7 }, (_, i) => ({
    value: i + 1,
    label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)),
  }));

  // Pending edits are merged, not replaced: changing two fields within the debounce
  // window used to drop the first one.
  const debouncedSave = useCallback(
    (patch: Parameters<typeof updateSettings>[0]) => {
      pendingPatch.current = { ...pendingPatch.current, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const toSave = pendingPatch.current;
        pendingPatch.current = {};
        await updateSettings(toSave);
        setSavedAt(Date.now());
      }, SAVE_DEBOUNCE_MS);
    },
    [updateSettings],
  );

  // Completion feedback: a short "Saved" after each write, then it fades away.
  useEffect(() => {
    if (savedAt === null) return;
    const id = setTimeout(() => setSavedAt(null), SAVED_INDICATOR_MS);
    return () => clearTimeout(id);
  }, [savedAt]);

  function handleChange<K extends keyof NonNullable<typeof local>>(
    key: K,
    value: NonNullable<typeof local>[K],
  ) {
    if (!local) return;
    const next = { ...local, [key]: value };
    setLocal(next);
    debouncedSave({ [key]: value });
  }

  function toggleWorkDay(day: number) {
    if (!local) return;
    const current = local.workDays;
    const next = current.includes(day)
      ? current.length > 1 ? current.filter(d => d !== day) : current
      : [...current, day].sort((a, b) => a - b);
    handleChange('workDays', next);
  }

  if (!local) return <div className="h-40 flex items-center justify-center text-text/40 text-sm">{t('loading')}</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Work schedule */}
      <section>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={expectedHoursId} className="text-sm font-medium text-text/80">{t('expectedHours')}</label>
            <input
              id={expectedHoursId}
              type="number"
              value={local.expectedHoursPerDay}
              onChange={e => handleChange('expectedHoursPerDay', parseFloat(e.target.value) || 8)}
              min={1} max={24} step={0.5}
              className="w-32 rounded-lg border border-text/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={minimumBreakId} className="text-sm font-medium text-text/80">{t('minimumBreak')}</label>
            <input
              id={minimumBreakId}
              type="number"
              value={local.minimumBreakMinutes}
              onChange={e => handleChange('minimumBreakMinutes', parseInt(e.target.value) || 0)}
              min={0} max={120} step={5}
              className="w-32 rounded-lg border border-text/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text/80">{t('workingDays')}</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWorkDay(d.value)}
                  aria-pressed={local.workDays.includes(d.value)}
                  className={`min-h-11 sm:min-h-0 px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${local.workDays.includes(d.value) ? 'bg-primary text-white' : 'bg-text/8 text-text/60 hover:bg-text/12'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={vacationDaysId} className="text-sm font-medium text-text/80">{t('annualVacationDays')}</label>
            <input
              id={vacationDaysId}
              type="number"
              value={local.annualVacationDays}
              onChange={e => handleChange('annualVacationDays', Math.max(0, parseInt(e.target.value) || 0))}
              min={0} max={366} step={1}
              className="w-32 rounded-lg border border-text/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
            <p className="text-xs text-text-muted">{t('vacationUsed', { used: vacationUsed, total: local.annualVacationDays })}</p>
          </div>
        </div>
      </section>

      {/* Height is reserved so the status appearing never shifts the layout. */}
      <p aria-live="polite" className={`-mt-4 h-4 flex items-center gap-1 text-xs font-medium text-primary transition-opacity duration-200 ${savedAt !== null ? 'opacity-100' : 'opacity-0'}`}>
        {savedAt !== null && <><Check size={12} aria-hidden />{t('saved')}</>}
      </p>

    </div>
  );
}
