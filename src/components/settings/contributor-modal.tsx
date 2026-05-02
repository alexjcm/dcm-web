import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useState } from "react";
import { User } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/fields";
import type { ContributorDraft } from "../../types/settings";

type ContributorModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  auth0AutoSyncEnabled: boolean;
  canViewAuth0Sync: boolean;
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
  auth0AutoSyncEnabled,
  canViewAuth0Sync,
  draft,
  submitting,
  onClose,
  onChange,
  onSubmit
}: ContributorModalProps) => {
  const [showErrors, setShowErrors] = useState(false);
  const nameErrorId = "contributor-name-error";
  const emailErrorId = "contributor-email-error";

  const isValidEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isEmailError = draft.email.length > 0 && !isValidEmail(draft.email);
  const isNameError = !draft.name.trim();
  const auth0SyncLabel = canViewAuth0Sync
    ? "Reconciliar acceso con Auth0 al guardar"
    : "Sincronización de acceso con Auth0";
  const auth0SyncDescription = canViewAuth0Sync
    ? auth0AutoSyncEnabled
      ? "Si existe una cuenta válida en Auth0 se reutilizará; si no existe, DCM podrá crear una cuenta DB según el caso."
      : "Disponible cuando el superadmin active la sincronización automática con Auth0."
    : "La reconciliación con Auth0 se aplicará según la configuración definida por el superadmin.";

  const handleSubmit = () => {
    if (isEmailError || isNameError) {
      setShowErrors(true);
      return;
    }
    onSubmit();
  };

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
                  <div className="grid gap-1">
                    <Input
                      label="Nombres"
                      value={draft.name}
                      onChange={(event) => onChange({ ...draft, name: event.target.value })}
                      placeholder="Ej. Juan Pérez"
                      autoComplete="name"
                      disabled={submitting}
                      aria-invalid={showErrors && isNameError ? true : undefined}
                      aria-describedby={showErrors && isNameError ? nameErrorId : undefined}
                      className={showErrors && isNameError ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20" : ""}
                    />
                    {showErrors && isNameError && (
                      <p
                        id={nameErrorId}
                        className="px-1 text-xs font-medium text-danger-600 dark:text-danger-400 animate-in fade-in slide-in-from-top-1"
                      >
                        El nombre es obligatorio
                      </p>
                    )}
                  </div>
                  <div className="grid gap-1">
                    <Input
                      label="Correo"
                      type="email"
                      value={draft.email}
                      onChange={(event) => onChange({ ...draft, email: event.target.value.trim() })}
                      placeholder="juan@ejemplo.com"
                      autoComplete="email"
                      disabled={submitting}
                      aria-invalid={showErrors && isEmailError ? true : undefined}
                      aria-describedby={showErrors && isEmailError ? emailErrorId : undefined}
                      className={showErrors && isEmailError ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20" : ""}
                    />
                    {showErrors && isEmailError && (
                      <p
                        id={emailErrorId}
                        className="px-1 text-xs font-medium text-danger-600 dark:text-danger-400 animate-in fade-in slide-in-from-top-1"
                      >
                        Por favor ingresa un correo válido (ej: nombre@ejemplo.com)
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-neutral-50/80 p-3 dark:bg-neutral-900/30">
                    <label className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={canViewAuth0Sync ? auth0AutoSyncEnabled : false}
                        readOnly
                        disabled
                        className="mt-0.5 h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {auth0SyncLabel}
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {auth0SyncDescription}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-border bg-card px-5 py-4 sm:flex-row-reverse sm:gap-3 sm:px-8 sm:py-6">

                  <Button 
                    onClick={handleSubmit} 
                    isLoading={submitting} 
                    className="sm:min-w-[170px]"
                  >
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
