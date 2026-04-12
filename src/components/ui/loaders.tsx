export const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => {
  return (
    <span
      className={`${className} inline-block animate-spin rounded-full border-2 border-slate-300 border-t-slate-700`}
      aria-hidden="true"
    />
  );
};

export const PageLoader = ({ label = "Cargando..." }: { label?: string }) => {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-700">
      <Spinner className="h-8 w-8" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export const SectionLoader = ({ label = "Cargando datos..." }: { label?: string }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700">
      <Spinner />
      <span>{label}</span>
    </div>
  );
};
