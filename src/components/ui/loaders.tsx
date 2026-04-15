export const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => {
  return (
    <span
      className={`${className} inline-block animate-spin rounded-full border-2 border-slate-200 border-t-primary-600`}
      aria-hidden="true"
    />
  );
};

export const PageLoader = ({ label = "Cargando..." }: { label?: string }) => {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-600">
      <div className="relative flex items-center justify-center">
        <Spinner className="h-12 w-12" />
        <div className="absolute h-6 w-6 rounded-full bg-primary-100/50 animate-pulse" />
      </div>
      <p className="text-sm font-semibold tracking-tight uppercase opacity-80">{label}</p>
    </div>
  );
};

export const SectionLoader = ({ label = "Cargando datos..." }: { label?: string }) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm p-5 text-sm text-slate-700 shadow-sm border-dashed">
      <Spinner className="h-6 w-6" />
      <span className="font-medium">{label}</span>
    </div>
  );
};

