'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings as updateSettingsService } from '@/lib/services/settings.service';
import { applyTheme } from '@/lib/theme';
import type { Settings } from '@/lib/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await getSettings();
        const hasVisited = localStorage.getItem('trackhour-visited');
        if (!hasVisited) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          const updated = await updateSettingsService({ theme: systemTheme });
          localStorage.setItem('trackhour-visited', '1');
          if (active) { setSettings(updated); applyTheme(systemTheme); }
        } else {
          if (active) { setSettings(saved); applyTheme(saved.theme); }
        }
      } catch (e) {
        if (active) setError(String(e));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const updateSettings = useCallback(async (data: Partial<Settings>) => {
    setSettings(prev => (prev ? { ...prev, ...data } : null));
    if (data.theme) applyTheme(data.theme);
    try {
      const saved = await updateSettingsService(data);
      setSettings(saved);
    } catch (e) {
      setError(String(e));
      const reverted = await getSettings();
      setSettings(reverted);
      applyTheme(reverted.theme);
    }
  }, []);

  return { settings, isLoading, error, updateSettings };
}
