interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'neutral';
  label: string;
}

const variants = {
  success: 'bg-primary/15 text-primary',
  warning: 'bg-tertiary/15 text-tertiary',
  error: 'bg-secondary/15 text-secondary',
  neutral: 'bg-text/8 text-text/50',
};

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
