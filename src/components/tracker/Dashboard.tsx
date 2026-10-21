'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Settings } from 'lucide-react';
import { useSettings } from '@/lib/hooks/useSettings';
import { localDateStr } from '@/lib/business/calculations';
import { ToastProvider } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
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
            <Button variant="link-primary" size="text" onClick={() => dismissWelcome(true)}>
              {t('welcomeSetup')}
            </Button>
            <Button variant="subtle" size="icon" onClick={() => dismissWelcome(false)} aria-label={t('welcomeDismiss')} className="-m-2">
              <X size={14} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Content — settings live in the date header rather than on a row of their own */}
      {isLoading && !settings ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-text/5 animate-pulse" />)}
        </div>
      ) : (
        <ClockTab
          date={selectedDate}
          onDateChange={setSelectedDate}
          headerAction={
            <Button variant="subtle" size="icon" onClick={() => setSettingsOpen(true)} aria-label={t('settingsTitle')}>
              <Settings size={18} aria-hidden />
            </Button>
          }
        />
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
