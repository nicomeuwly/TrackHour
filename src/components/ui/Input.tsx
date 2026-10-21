'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

const LABEL_CLASS = {
  default: 'text-sm font-medium text-text/80',
  /** Smaller and muted, for free-text fields that sit under the main content. */
  caption: 'text-xs font-medium text-text-muted',
  /** Beside the control rather than above it, for single-field rows. */
  inline: 'text-sm text-text-muted whitespace-nowrap',
} as const;

type LabelStyle = keyof typeof LABEL_CLASS;

interface FieldOptions {
  /** Visible label. Without one, pass an `aria-label`. */
  label?: string;
  labelStyle?: LabelStyle;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
}

// The time picker icon is drawn black by the browser; invert it on dark backgrounds.
function controlClass(hasError: boolean, compact = false) {
  return `rounded-lg border ${hasError ? 'border-secondary' : 'border-text/15'} bg-background text-sm text-text placeholder:text-text/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors dark:[&::-webkit-calendar-picker-indicator]:invert ${compact ? 'px-2 py-1' : 'px-3 py-2'}`;
}

function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

function Field({
  id,
  label,
  labelStyle = 'default',
  hint,
  error,
  children,
}: Omit<FieldOptions, 'onChange'> & { id: string; children: ReactNode }) {
  if (!label && !hint && !error) return children;
  return (
    <div className={labelStyle === 'inline' ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS[labelStyle]}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-secondary">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>,
    FieldOptions {
  value: string | number;
  /** Tighter padding, for inline editors such as time inputs. */
  compact?: boolean;
}

/** Text, number and time input. `className` applies to the control (e.g. a width). */
export default function Input({
  label,
  labelStyle,
  hint,
  error,
  onChange,
  compact,
  id,
  type = 'text',
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field id={inputId} label={label} labelStyle={labelStyle} hint={hint} error={error}>
      <input
        {...props}
        id={inputId}
        type={type}
        onChange={e => onChange(e.target.value)}
        aria-describedby={describedBy(inputId, error, hint)}
        aria-invalid={error ? true : undefined}
        className={`${controlClass(!!error, compact)} ${className}`}
      />
    </Field>
  );
}

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>,
    FieldOptions {
  value: string;
}

export function Textarea({
  label,
  labelStyle,
  hint,
  error,
  onChange,
  id,
  rows = 2,
  className = '',
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field id={inputId} label={label} labelStyle={labelStyle} hint={hint} error={error}>
      <textarea
        {...props}
        id={inputId}
        rows={rows}
        onChange={e => onChange(e.target.value)}
        aria-describedby={describedBy(inputId, error, hint)}
        aria-invalid={error ? true : undefined}
        className={`${controlClass(!!error)} resize-none ${className}`}
      />
    </Field>
  );
}
