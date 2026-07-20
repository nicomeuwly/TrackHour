'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Settings } from 'lucide-react';
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
        <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">{t('welcomeTitle')}</p>
            <p className="text-xs text-text/60 mt-0.5">{t('welcomeSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <button onClick={() => dismissWelcome(true)} className="text-xs font-medium text-primary hover:underline">
              {t('welcomeSetup')}
            </button>
            <button onClick={() => dismissWelcome(false)} aria-label="Dismiss"
              className="text-text/30 hover:text-text/60 transition-colors">
              <X size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label={t('settingsTitle')}
          className="p-2.5 rounded-xl hover:bg-text/8 transition-colors text-text/60 hover:text-text"
        >
          <Settings size={18} aria-hidden />
        </button>
      </div>

      {/* Content */}
      {isLoading && !settings ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-text/5 animate-pulse" />)}
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
