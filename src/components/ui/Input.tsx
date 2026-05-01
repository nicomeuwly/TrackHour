'use client';

interface InputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  id?: string;
  rows?: number;
}

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  hint,
  min,
  max,
  step,
  id,
  rows,
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const baseClass =
    'w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-foreground/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-colors';
  const borderClass = error
    ? 'border-red-400 dark:border-red-500'
    : 'border-foreground/15 dark:border-foreground/20';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground/80">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 2}
          className={`${baseClass} ${borderClass} resize-none`}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`${baseClass} ${borderClass}`}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
        />
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-foreground/50">
          {hint}
        </p>
      )}
    </div>
  );
}
