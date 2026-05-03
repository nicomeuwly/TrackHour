'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/lib/hooks/useSettings';
import { localDateStr } from '@/lib/business/calculations';
import { ToastProvider } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ClockTab from './ClockTab';
import SettingsPanel from '@/components/settings/SettingsPanel';

function DashboardInner() {
  const t = useTranslations('Dashboard');
  const searchParams = useSearchParams();
  const today = localDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') ?? today);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    if (!isLoading && !localStorage.getItem('trackhour-welcome-dismissed')) {
      if (!localStorage.getItem('trackhour-visited')) setShowWelcome(true);
    }
  }, [isLoading]);

  function dismissWelcome(openSettings = false) {
    localStorage.setItem('trackhour-welcome-dismissed', '1');
    setShowWelcome(false);
    if (openSettings) setSettingsOpen(true);
  }

  return (
    <div className="min-h-0 flex flex-col">
      {/* Welcome banner */}
      {showWelcome && (
        <div className="mb-4 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-accent">{t('welcomeTitle')}</p>
            <p className="text-xs text-foreground/60 mt-0.5">{t('welcomeSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <button onClick={() => dismissWelcome(true)} className="text-xs font-medium text-accent hover:underline">
              {t('welcomeSetup')}
            </button>
            <button onClick={() => dismissWelcome(false)} aria-label="Dismiss"
              className="text-foreground/30 hover:text-foreground/60 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label={t('settingsTitle')}
          className="p-2.5 rounded-xl hover:bg-foreground/8 transition-colors text-foreground/60 hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      {isLoading && !settings ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-foreground/5 animate-pulse" />)}
        </div>
      ) : (
        <ClockTab date={selectedDate} onDateChange={setSelectedDate} />
      )}

      {/* Settings modal */}
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title={t('settingsTitle')}>
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      </Modal>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardInner />
    </ToastProvider>
  );
}
