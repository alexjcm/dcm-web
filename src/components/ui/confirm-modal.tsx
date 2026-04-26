import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "./button";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  compact?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  compact = false,
  loading = false,
  onCancel,
  onConfirm
}: ConfirmModalProps) => {
  const panelPaddingClass = compact ? "p-5 sm:p-6" : "p-8";
  const panelGapClass = compact ? "gap-3" : "gap-4";
  const iconClass = compact ? "h-10 w-10 rounded-xl" : "h-12 w-12 rounded-2xl";
  const titleClass = compact ? "text-lg" : "text-xl";
  const footerPaddingClass = compact ? "px-5 py-4 sm:px-6" : "px-8 py-6";
  const iconSize = compact ? 20 : 24;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => undefined : onCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-900/32 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4 md:p-8">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <DialogPanel className="w-full max-w-md overflow-hidden rounded-[var(--radius-dialog)] border border-border bg-card shadow-dialog transition-all">
                <div className={panelPaddingClass}>
                  <div className={`flex items-start ${panelGapClass}`}>
                    <div className={`flex shrink-0 items-center justify-center shadow-sm ${iconClass} ${
                      danger 
                        ? "border border-danger-300 bg-danger-100/70 text-danger-700 dark:border-danger-800 dark:bg-danger-900/30" 
                        : "border border-primary-200 bg-primary-50/80 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30"
                    }`}>
                      {danger ? <AlertTriangle size={iconSize} /> : <Info size={iconSize} />}
                    </div>
                    <div>
                      <DialogTitle className={`${titleClass} font-extrabold text-neutral-900 tracking-tight dark:text-neutral-100`}>
                        {title}
                      </DialogTitle>
                      <p className="mt-2 text-sm leading-relaxed font-medium text-neutral-700 dark:text-neutral-300">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col gap-3 border-t border-border bg-card ${footerPaddingClass} sm:flex-row-reverse`}>

                  <Button
                    variant={danger ? "danger" : "primary"}
                    onClick={onConfirm}
                    isLoading={loading}
                    className="sm:min-w-[120px]"
                  >
                    {confirmLabel}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelLabel}
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
