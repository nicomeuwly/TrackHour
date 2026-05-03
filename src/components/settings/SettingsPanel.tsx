'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useSettings } from '@/lib/hooks/useSettings';

interface SettingsPanelProps {
  onClose?: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const t = useTranslations('Settings');
  const locale = useLocale();
  const { settings, updateSettings } = useSettings();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [local, setLocal] = useState(settings);
  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  const DAYS = Array.from({ length: 7 }, (_, i) => ({
    value: i + 1,
    label: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)),
  }));

  const debouncedSave = useCallback(
    (patch: Parameters<typeof updateSettings>[0]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => updateSettings(patch), 500);
    },
    [updateSettings],
  );

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

  if (!local) return <div className="h-40 flex items-center justify-center text-foreground/40 text-sm">{t('loading')}</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Work schedule */}
      <section>
        <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-4">{t('workSchedule')}</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">{t('expectedHours')}</label>
            <input
              type="number"
              value={local.expectedHoursPerDay}
              onChange={e => handleChange('expectedHoursPerDay', parseFloat(e.target.value) || 8)}
              min={1} max={24} step={0.5}
              className="w-32 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">{t('minimumBreak')}</label>
            <input
              type="number"
              value={local.minimumBreakMinutes}
              onChange={e => handleChange('minimumBreakMinutes', parseInt(e.target.value) || 0)}
              min={0} max={120} step={5}
              className="w-32 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground/80">{t('workingDays')}</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWorkDay(d.value)}
                  aria-pressed={local.workDays.includes(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${local.workDays.includes(d.value) ? 'bg-accent text-white' : 'bg-foreground/8 text-foreground/60 hover:bg-foreground/12'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
