import { type InputHTMLAttributes, type SelectHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg border border-slate-300 bg-white py-2 text-sm text-slate-900 transition-colors
              placeholder:text-slate-400
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
              disabled:cursor-not-allowed disabled:opacity-50
              ${Icon ? "pl-10 pr-3" : "px-3"}
              ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
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
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 text-sm text-slate-900 transition-colors
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
              disabled:cursor-not-allowed disabled:opacity-50
              ${Icon ? "pl-10 pr-10" : "pl-3 pr-10"}
              ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : ""}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

