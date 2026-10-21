'use client';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Mutually exclusive views; the selected segment is raised onto the track. */
export default function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex bg-text/6 rounded-xl p-0.5">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${value === option.value ? 'bg-background shadow-sm text-text' : 'text-text-muted hover:text-text'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
