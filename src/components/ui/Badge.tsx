interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'neutral';
  label: string;
}

const variants = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  neutral: 'bg-foreground/8 text-foreground/50',
};

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
