import { type ButtonHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      icon: Icon,
      iconPosition = "left",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-[0.01em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "border border-neutral-800 bg-neutral-800 text-white hover:bg-neutral-900 hover:border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 dark:hover:bg-white dark:hover:border-white",
      secondary: "border border-neutral-800 bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-800/80 dark:border-neutral-700 dark:hover:bg-neutral-700/80 dark:hover:border-neutral-600",
      outline: "border border-primary-100 bg-white/90 text-neutral-700 hover:border-primary-400 hover:bg-primary-50/60 dark:bg-neutral-800/80 dark:text-neutral-200 dark:border-neutral-700 dark:hover:border-primary-500 dark:hover:bg-primary-900/10",
      ghost: "text-neutral-700 hover:bg-primary-50/70 dark:text-neutral-300 dark:hover:bg-neutral-800",
      danger: "border border-danger-700 bg-danger-700 text-white hover:bg-danger-800 dark:bg-danger-900/80 dark:border-danger-700 dark:text-danger-200 dark:hover:bg-danger-800",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };


    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : 18} />}
        {children}
        {!isLoading && Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : 18} />}
      </button>
    );
  }
);

Button.displayName = "Button";
