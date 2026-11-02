import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card = ({
  children,
  header,
  footer,
  className = "",
  bodyClassName = "",
}: CardProps) => {
  return (
    <article
      className={`overflow-hidden rounded-[var(--radius-card)] border border-border bg-card transition-colors ${className}`}
    >
      {header && (
        <div className="border-b border-border bg-[var(--surface-header)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="text-sm font-semibold tracking-[0.01em] text-neutral-900 dark:text-neutral-100">{header}</div>
        </div>
      )}
      <div className={`px-4 py-4 sm:px-6 sm:py-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-border bg-[var(--surface-footer)] px-6 py-3">
          {footer}
        </div>
      )}
    </article>

  );
};
