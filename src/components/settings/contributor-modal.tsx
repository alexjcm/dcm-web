import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { User } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/fields";
import type { ContributorDraft } from "../../types/settings";

type ContributorModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  draft: ContributorDraft;
  submitting: boolean;
  onClose: () => void;
  onChange: (draft: ContributorDraft) => void;
  onSubmit: () => void;
};

export const ContributorModal = ({
  open,
  title,
  submitLabel,
  draft,
  submitting,
  onClose,
  onChange,
  onSubmit
}: ContributorModalProps) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={submitting ? () => undefined : onClose}>
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

        <div className="fixed inset-0 overflow-y-auto p-3 sm:p-5 md:p-8">
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
              <DialogPanel className="w-full max-w-lg overflow-hidden rounded-[var(--radius-dialog)] border border-border bg-card shadow-dialog transition-all">
                <div className="border-b border-border bg-[var(--gradient-modal-header)] px-5 py-4 sm:px-8 sm:py-6">
                  <DialogTitle className="flex items-center gap-3 text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-200 bg-primary-50/80 text-primary-700 shadow-sm dark:border-primary-800 dark:bg-primary-900/30 sm:h-10 sm:w-10">
                      <User size={18} />
                    </div>
                    {title}
                  </DialogTitle>
                </div>

                <div className="grid gap-4 p-5 sm:gap-5 sm:p-8">
                  <Input
                    label="Nombres"
                    value={draft.name}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                    placeholder="Ej. Juan Pérez"
                    disabled={submitting}
                  />
                  <Input
                    label="Correo"
                    type="email"
                    value={draft.email}
                    onChange={(event) => onChange({ ...draft, email: event.target.value })}
                    placeholder="juan@ejemplo.com"
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-col gap-2.5 border-t border-border bg-card px-5 py-4 sm:flex-row-reverse sm:gap-3 sm:px-8 sm:py-6">

                  <Button onClick={onSubmit} isLoading={submitting} className="sm:min-w-[170px]">
                    {submitLabel}
                  </Button>
                  <Button variant="ghost" onClick={onClose} disabled={submitting}>
                    Cancelar
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
