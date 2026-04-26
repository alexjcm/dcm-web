type AppVersionFooterProps = {
  className?: string;
};

export const AppVersionFooter = ({ className = "" }: AppVersionFooterProps) => {
  return (
    <footer
      className={`px-4 pt-3 text-center ${className}`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <p className="text-[11px] font-medium tracking-[0.02em] text-neutral-400 dark:text-neutral-500">
        Versión {__APP_VERSION__}
      </p>
    </footer>
  );
};
