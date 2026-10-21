'use client';

import { useTranslations } from 'next-intl';
import { Sun, Moon } from 'lucide-react';
import { useSettings } from '@/lib/hooks/useSettings';
import Button from '@/components/ui/Button';

export default function ThemeToggle() {
  const t = useTranslations('Common');
  const { settings, isLoading, updateSettings } = useSettings();

  // Reserve space while loading to avoid layout shift
  if (isLoading || !settings) {
    return <div className="size-11 sm:size-9" aria-hidden />;
  }

  const isDark = settings.theme === 'dark';

  return (
    <Button
      variant="subtle"
      size="icon"
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      aria-label={isDark ? t('switchToLight') : t('switchToDark')}
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </Button>
  );
}
