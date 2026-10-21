'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AppError } from '@/lib/errors';

/** Turns a caught error into display text: expected failures (AppError) are translated,
 *  anything unexpected falls back to its raw message. */
export function useErrorMessage() {
  const t = useTranslations('Errors');
  return useCallback(
    (e: unknown) => (e instanceof AppError ? t(e.code, e.params) : String(e).replace(/^Error: /, '')),
    [t],
  );
}
