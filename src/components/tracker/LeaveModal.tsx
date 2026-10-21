'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LEAVE_TYPES, LEAVE_LABEL_KEY, LEAVE_DESC_KEY, LEAVE_ICON } from './leaveMeta';
import type { LeaveType } from '@/lib/types';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: LeaveType | null;
  note: string;
  vacationUsed: number;
  vacationTotal: number;
  onSave: (type: LeaveType | null, comment: string) => void;
}

export default function LeaveModal({
  isOpen,
  onClose,
  current,
  note,
  vacationUsed,
  vacationTotal,
  onSave,
}: LeaveModalProps) {
  const t = useTranslations('ClockTab');
  const [selected, setSelected] = useState<LeaveType | null>(current);
  const [comment, setComment] = useState(note);

  useEffect(() => {
    if (isOpen) {
      setSelected(current);
      setComment(note);
    }
  }, [isOpen, current, note]);

  // Preview the remaining count assuming the pending choice is applied.
  const pendingVacation = (selected === 'vacation' ? 1 : 0) - (current === 'vacation' ? 1 : 0);
  const vacationRemaining = Math.max(0, vacationTotal - vacationUsed - pendingVacation);

  function handleSave() {
    if (selected === null) return;
    onSave(selected, selected === 'other' ? comment : note);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('leaveModalTitle')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('leaveModalTitle')}>
          {LEAVE_TYPES.map(type => {
            const Icon = LEAVE_ICON[type];
            return (
              <button
                key={type}
                role="radio"
                aria-checked={selected === type}
                onClick={() => setSelected(type)}
                className={`flex items-start gap-3 text-left rounded-xl border px-4 py-3 ${selected === type ? 'border-tertiary bg-tertiary/10' : 'border-text/10 hover:bg-text/4'}`}
              >
                <Icon size={20} aria-hidden className={`mt-0.5 flex-none ${selected === type ? 'text-tertiary' : 'text-text/40'}`} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{t(LEAVE_LABEL_KEY[type])}</span>
                  <span className="text-xs text-text/50 mt-0.5">{t(LEAVE_DESC_KEY[type])}</span>
                  {type === 'vacation' && (
                    <span className="text-xs font-medium text-tertiary mt-1.5">
                      {t('vacationRemaining', { remaining: vacationRemaining, total: vacationTotal })}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selected === 'other' && (
          <Input
            label={t('leaveCommentLabel')}
            labelStyle="caption"
            value={comment}
            onChange={setComment}
            placeholder={t('leaveCommentPlaceholder')}
          />
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {current !== null ? (
            <Button variant="link-danger" size="text" onClick={() => { onSave(null, note); onClose(); }}>
              {t('leaveRemove')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="link" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={selected === null}>
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
