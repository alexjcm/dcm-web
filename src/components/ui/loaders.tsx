export const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => {
  return (
    <span
      className={`${className} inline-block animate-spin rounded-full border-2 border-primary-100 border-t-primary-700`}
      aria-hidden="true"
    />
  );
};

export const PageLoader = ({ label = "Cargando..." }: { label?: string }) => {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-neutral-600 dark:text-neutral-400">
      <Spinner className="h-12 w-12" />
      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
    </div>
  );
};

export const SectionLoader = ({ label = "Cargando datos..." }: { label?: string }) => {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-[var(--surface-loader)] p-5 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
      <Spinner className="h-6 w-6" />
      <span className="font-medium tracking-[0.01em]">{label}</span>
    </div>
  );
};

