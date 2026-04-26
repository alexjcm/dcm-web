import { type InputHTMLAttributes, type SelectHTMLAttributes, forwardRef, useId } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, prefix, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold tracking-[0.01em] text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
              <Icon size={18} />
            </div>
          )}
          {prefix && !Icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500 dark:text-neutral-400">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-xl border border-border bg-white py-2.5 text-sm text-neutral-900 shadow-sm transition-colors
              placeholder:text-neutral-400
              focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400
              disabled:cursor-not-allowed disabled:opacity-50
              dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500
              ${Icon ? "pl-10 pr-3" : prefix ? "pl-8 pr-3" : "px-3"}
              ${error ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, icon: Icon, className = "", children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = props.id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold tracking-[0.01em] text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
              <Icon size={18} />
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full appearance-none rounded-xl border border-border bg-white py-2.5 text-sm text-neutral-900 shadow-sm transition-colors
              focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400
              disabled:cursor-not-allowed disabled:opacity-50
              dark:bg-neutral-800 dark:text-neutral-100
              ${Icon ? "pl-10 pr-10" : "pl-3 pr-10"}
              ${error ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500" : ""}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500 dark:text-neutral-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs font-medium text-danger-600">{error}</p>}

      </div>
    );
  }
);

Select.displayName = "Select";
