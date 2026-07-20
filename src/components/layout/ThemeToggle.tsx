'use client';

import { useTranslations } from 'next-intl';
import { Sun, Moon } from 'lucide-react';
import { useSettings } from '@/lib/hooks/useSettings';

export default function ThemeToggle() {
  const t = useTranslations('Common');
  const { settings, isLoading, updateSettings } = useSettings();

  // Reserve space while loading to avoid layout shift
  if (isLoading || !settings) {
    return <div className="w-9 h-9" aria-hidden />;
  }

  const isDark = settings.theme === 'dark';

  return (
    <button
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      aria-label={isDark ? t('switchToLight') : t('switchToDark')}
      className="p-2 rounded-lg hover:bg-text/8 transition-colors text-text/60 hover:text-text"
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
