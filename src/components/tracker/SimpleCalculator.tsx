'use client';

import { useState } from 'react';
import {
  calculateWorkedMinutes,
  calculateBalance,
  formatMinutes,
  formatMinutesAsDecimal,
} from '@/lib/business/calculations';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import BalanceDisplay from '@/components/ui/BalanceDisplay';

export default function SimpleCalculator() {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakDuration, setBreakDuration] = useState('0');
  const [expectedHours, setExpectedHours] = useState('8');

  const breakNum = parseInt(breakDuration) || 0;
  const expectedNum = parseFloat(expectedHours) || 8;

  const worked =
    startTime && endTime
      ? calculateWorkedMinutes(startTime, endTime, breakNum)
      : null;
  const balance =
    worked !== null ? calculateBalance(worked, expectedNum) : null;

  return (
    <Card className="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start time"
            type="time"
            value={startTime}
            onChange={setStartTime}
          />
          <Input
            label="End time"
            type="time"
            value={endTime}
            onChange={setEndTime}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Break (minutes)"
            type="number"
            value={breakDuration}
            onChange={setBreakDuration}
            min={0}
            max={480}
            step={5}
          />
          <Input
            label="Expected hours"
            type="number"
            value={expectedHours}
            onChange={setExpectedHours}
            min={1}
            max={24}
            step={0.5}
          />
        </div>

        {worked !== null ? (
          <div className="rounded-xl bg-foreground/4 px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Time worked</span>
              <span className="font-bold text-lg">{formatMinutes(worked)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Decimal</span>
              <span className="font-semibold">{formatMinutesAsDecimal(worked)}h</span>
            </div>
            {balance !== null && (
              <div className="flex items-center justify-between border-t border-foreground/10 pt-3">
                <span className="text-sm text-foreground/60">Balance vs {expectedNum}h</span>
                <BalanceDisplay balanceMinutes={balance} size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-foreground/4 px-4 py-6 text-center text-sm text-foreground/40">
            Enter start and end time to calculate
          </div>
        )}
      </div>
    </Card>
  );
}
