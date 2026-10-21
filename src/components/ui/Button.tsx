'use client';

import { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

// Variants own color (text, background, border) and sizes own geometry and type, so
// the two never set the same property and `className` can safely add layout on top.
// No transition-* utility here: globals.css gives every button a base transition that
// includes `scale` for press feedback, and a transition utility would drop it.
const variants = {
  /** Solid call to action. */
  primary: 'bg-primary text-white hover:opacity-90',
  /** Solid red: confirms a destructive action. */
  danger: 'bg-secondary text-white hover:opacity-90',
  /** Neutral outline, text color inherited. */
  outline: 'border border-text/15 hover:bg-text/5',
  'outline-primary': 'border border-primary/30 text-primary hover:bg-primary/8',
  /** Destructive action that asks for confirmation first. */
  'outline-danger': 'border border-secondary/30 text-secondary hover:bg-secondary/10',
  /** Active leave/absence state. */
  'outline-tertiary': 'border border-tertiary/30 bg-tertiary/10 text-tertiary',
  /** Tinted with a solid border: the clock in / clock out tones. */
  'tinted-primary': 'border border-primary bg-primary/10 text-primary hover:bg-primary/20',
  'tinted-danger': 'border border-secondary bg-secondary/10 text-secondary hover:bg-secondary/20',
  /** Filled but quiet: unselected toggles. */
  soft: 'bg-text/8 text-text-muted hover:bg-text/12',
  /** No chrome until hover, text color inherited. */
  ghost: 'hover:bg-text/8',
  /** Ghost with a muted foreground that brightens on hover. */
  subtle: 'text-text-muted hover:bg-text/8 hover:text-text',
  /** Quiet text link. */
  link: 'text-text-muted hover:text-text',
  'link-primary': 'text-primary hover:underline',
  'link-danger': 'text-secondary hover:underline',
} as const;

// Chips stay visually compact (h-8) while a pseudo-element extends the touch
// target to 44px on coarse pointers.
const CHIP_HIT_AREA_CLASS =
  'relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1.5';

const sizes = {
  sm: 'gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
  md: 'gap-2 rounded-lg px-3 py-2 text-sm font-medium',
  lg: 'gap-2 rounded-xl px-8 py-3 text-base font-semibold',
  chip: `${CHIP_HIT_AREA_CLASS} h-8 gap-1.5 rounded-lg px-3 text-xs font-medium`,
  /** Icon-only: 44px touch target on mobile, compact from sm up. */
  icon: 'size-11 flex-none rounded-lg sm:size-9',
  /** Bare text, for links that sit inline with other content. */
  text: 'rounded-md text-sm',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : children}
    </button>
  );
}
