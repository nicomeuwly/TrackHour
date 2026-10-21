'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSettings } from '@/lib/hooks/useSettings';
import { useVacationUsage } from '@/lib/hooks/useVacationUsage';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
          <Input
            label={t('expectedHours')}
            type="number"
            value={local.expectedHoursPerDay}
            onChange={v => handleChange('expectedHoursPerDay', parseFloat(v) || 8)}
            min={1} max={24} step={0.5}
            className="w-32"
          />

          <Input
            label={t('minimumBreak')}
            type="number"
            value={local.minimumBreakMinutes}
            onChange={v => handleChange('minimumBreakMinutes', parseInt(v) || 0)}
            min={0} max={120} step={5}
            className="w-32"
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text/80">{t('workingDays')}</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <Button
                  key={d.value}
                  variant={local.workDays.includes(d.value) ? 'primary' : 'soft'}
                  size="sm"
                  onClick={() => toggleWorkDay(d.value)}
                  aria-pressed={local.workDays.includes(d.value)}
                  className="min-h-11 sm:min-h-0 capitalize"
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <Input
            label={t('annualVacationDays')}
            type="number"
            value={local.annualVacationDays}
            onChange={v => handleChange('annualVacationDays', Math.max(0, parseInt(v) || 0))}
            min={0} max={366} step={1}
            hint={t('vacationUsed', { used: vacationUsed, total: local.annualVacationDays })}
            className="w-32"
          />
        </div>
      </section>

      {/* Height is reserved so the status appearing never shifts the layout. */}
      <p aria-live="polite" className={`-mt-4 h-4 flex items-center gap-1 text-xs font-medium text-primary transition-opacity duration-200 ${savedAt !== null ? 'opacity-100' : 'opacity-0'}`}>
        {savedAt !== null && <><Check size={12} aria-hidden />{t('saved')}</>}
      </p>

    </div>
  );
}
