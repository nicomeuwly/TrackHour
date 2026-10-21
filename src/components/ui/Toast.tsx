'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  action?: ToastAction;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const TOAST_DURATION_MS = 3000;
// Toasts carrying an action (e.g. undo) stay longer so there is time to reach it.
const TOAST_WITH_ACTION_DURATION_MS = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, string> = {
  success: 'bg-primary text-white',
  error: 'bg-secondary text-white',
  info: 'bg-text text-background',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, action: options?.action }]);
    setTimeout(() => dismissToast(id), options?.action ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-200 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg text-sm font-medium pointer-events-auto ${typeStyles[t.type]}`}
          >
            <span className="flex-none w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {typeIcons[t.type]}
            </span>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { dismissToast(t.id); t.action?.onClick(); }}
                className="-my-2 -mr-2 min-h-11 px-3 rounded-lg font-semibold underline underline-offset-2 hover:bg-current/15 transition-colors"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
