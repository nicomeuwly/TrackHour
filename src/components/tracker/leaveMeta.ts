import { TreePalm, HeartPulse, CircleHelp, Hourglass, type LucideIcon } from 'lucide-react';
import type { LeaveType } from '@/lib/types';

export const LEAVE_TYPES: LeaveType[] = ['vacation', 'sick', 'compensation', 'other'];

export const LEAVE_LABEL_KEY: Record<LeaveType, string> = {
  vacation: 'leaveVacation',
  sick: 'leaveSick',
  other: 'leaveOther',
  compensation: 'leaveCompensation',
};

export const LEAVE_DESC_KEY: Record<LeaveType, string> = {
  vacation: 'leaveVacationDesc',
  sick: 'leaveSickDesc',
  other: 'leaveOtherDesc',
  compensation: 'leaveCompensationDesc',
};

export const LEAVE_ICON: Record<LeaveType, LucideIcon> = {
  vacation: TreePalm,
  sick: HeartPulse,
  other: CircleHelp,
  compensation: Hourglass,
};

/** Icon representing absences in general (defaults to the vacation icon). */
export const ABSENCE_ICON: LucideIcon = TreePalm;
