'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/lib/hooks/useSettings';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

type AppPathname = keyof typeof routing.pathnames;

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [local, setLocal] = useState(settings);
  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

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

  if (!local) return <div className="h-40 flex items-center justify-center text-foreground/40 text-sm">Loading…</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Work schedule */}
      <section>
        <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-4">Work Schedule</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">Expected hours per day</label>
            <input
              type="number"
              value={local.expectedHoursPerDay}
              onChange={e => handleChange('expectedHoursPerDay', parseFloat(e.target.value) || 8)}
              min={1} max={24} step={0.5}
              className="w-32 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground/80">Minimum break (minutes)</label>
            <input
              type="number"
              value={local.minimumBreakMinutes}
              onChange={e => handleChange('minimumBreakMinutes', parseInt(e.target.value) || 0)}
              min={0} max={120} step={5}
              className="w-32 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground/80">Working days</p>
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

      {/* Preferences */}
      <section>
        <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-4">Preferences</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground/80">Language</p>
            <div className="flex gap-1">
              {['en', 'fr'].map(l => (
                <button
                  key={l}
                  onClick={() => {
                    handleChange('locale', l);
                    router.replace(pathname as AppPathname, { locale: l });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${locale === l ? 'bg-accent text-white' : 'bg-foreground/8 text-foreground/60 hover:bg-foreground/12'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground/80">Theme</p>
            <button
              onClick={() => handleChange('theme', local.theme === 'dark' ? 'light' : 'dark')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${local.theme === 'dark' ? 'bg-accent' : 'bg-foreground/20'}`}
              role="switch"
              aria-checked={local.theme === 'dark'}
              aria-label="Toggle dark mode"
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${local.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
