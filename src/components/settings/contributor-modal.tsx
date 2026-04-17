import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { User } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/fields";

export type ContributorDraft = {
  name: string;
  email: string;
};

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

export const emptyContributorDraft: ContributorDraft = {
  name: "",
  email: ""
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
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
              <DialogPanel className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="border-b border-slate-100 bg-slate-50 px-8 py-6">
                  <DialogTitle className="flex items-center gap-3 text-lg font-extrabold text-slate-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary-600 shadow-sm">
                      <User size={18} />
                    </div>
                    {title}
                  </DialogTitle>
                </div>

                <div className="grid gap-5 p-8">
                  <Input
                    label="Nombre Completo"
                    value={draft.name}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                    placeholder="Ej. Juan Pérez"
                    disabled={submitting}
                  />
                  <Input
                    label="Email Principal"
                    type="email"
                    value={draft.email}
                    onChange={(event) => onChange({ ...draft, email: event.target.value })}
                    placeholder="juan@ejemplo.com"
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-8 py-6 sm:flex-row-reverse">
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
