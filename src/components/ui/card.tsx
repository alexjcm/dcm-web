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
    <article className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`}>
      {header && (
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="text-sm font-semibold text-slate-900">{header}</div>
        </div>
      )}
      <div className={`px-6 py-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          {footer}
        </div>
      )}
    </article>
  );
};
