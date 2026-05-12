import { formatMinutes } from '@/lib/business/calculations';

interface BalanceDisplayProps {
  balanceMinutes: number;
  size?: 'sm' | 'lg' | 'base';
}

export default function BalanceDisplay({ balanceMinutes, size = 'sm' }: BalanceDisplayProps) {
  const abs = Math.abs(balanceMinutes);
  const isPositive = balanceMinutes > 0;
  const isNegative = balanceMinutes < 0;

  const colorClass = isPositive
    ? 'text-primary'
    : isNegative
    ? 'text-secondary'
    : 'text-text-muted';

  const sizeClass = size === 'lg' ? 'text-3xl font-bold' : size === 'base' ? 'text-base font-semibold' : 'text-sm font-semibold';
  const iconSize = size === 'lg' ? 'w-6 h-6' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass} ${sizeClass} tabular-nums`}>
      {isPositive && (
        <svg className={iconSize} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 3l5 6H3z" />
        </svg>
      )}
      {isNegative && (
        <svg className={iconSize} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 13l5-6H3z" />
        </svg>
      )}
      {formatMinutes(abs)}
    </span>
  );
}
