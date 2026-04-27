import { type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";

type ScreenHelpButtonProps = {
  title: string;
  description: ReactNode;
  className?: string;
  toastId?: string;
};

export const ScreenHelpButton = ({ title, description, className = "", toastId }: ScreenHelpButtonProps) => {
  const stableToastId = toastId ?? `screen-help:${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <button
      type="button"
      onClick={() => {
        toast.message(title, {
          description,
          id: stableToastId,
          duration: 10000,
          className: "!rounded-[var(--radius-dialog)] !p-5 !shadow-dialog border-border dark:border-neutral-700",
          classNames: {
            title: "!text-lg !font-extrabold !tracking-tight text-neutral-900 dark:text-neutral-100",
            description: "!mt-2",
            closeButton:
              "!h-8 !w-8 !rounded-lg !border !border-border !bg-white/95 !text-neutral-600 hover:!bg-neutral-100 dark:!border-neutral-600 dark:!bg-neutral-800 dark:!text-neutral-300 dark:hover:!bg-neutral-700"
          }
        });
      }}
      aria-label={`Ayuda: ${title}`}
      title={`Ayuda: ${title}`}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 ${className}`}
    >
      <CircleHelp size={16} />
    </button>
  );
};
