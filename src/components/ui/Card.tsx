import { type HTMLAttributes, type ReactNode } from 'react';

const paddings = {
  none: '',
  sm: 'px-4 py-3',
  md: 'p-5',
  lg: 'p-6',
} as const;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  /** `none` for cards whose rows carry their own padding (lists, dividers). */
  padding?: keyof typeof paddings;
}

export default function Card({ title, padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div {...props} className={`rounded-xl border border-text/10 bg-background ${paddings[padding]} ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-text/70 uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/** Compact metric tile: a muted caption above a bold value. */
export function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card padding="sm">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <div className="font-bold text-base">{children}</div>
    </Card>
  );
}
