interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-text/10 bg-background p-5 shadow-sm ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-text/70 uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
