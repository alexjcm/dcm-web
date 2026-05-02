import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ReceiptText, AlertCircle, Trash2 } from "lucide-react";

import type { Contribution, Contributor } from "../../types/domain";
import { getMonthLongLabel } from "../../lib/date";
import { formatCentsAsInputValue, parseMoneyInputToCents, sanitizeMoneyInput } from "../../lib/money";
import { Button } from "../ui/button";
import { Input, Select } from "../ui/fields";

export type ContributionPayload = {
  contributorId: number;
  year: number;
  month: number;
  amountCents: number;
};

type ContributionModalProps = {
  open: boolean;
  contributors: Contributor[];
  monthlyAmountCents: number;
  defaultYear: number;
  defaultMonth: number;
  initialContribution?: Contribution | null;
  fixedContributorId?: number;
  fixedYear?: number;
  fixedMonth?: number;
  lockedReason?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: ContributionPayload) => Promise<void>;
  onDelete?: () => void;
};

type FormState = {
  contributorId: string;
  year: string;
  month: string;
  amount: string;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const buildInitialState = (
  params: Pick<ContributionModalProps, "initialContribution" | "defaultYear" | "defaultMonth" | "monthlyAmountCents" | "fixedContributorId" | "fixedYear" | "fixedMonth">
): FormState => {
  const source = params.initialContribution;

  return {
    contributorId: String(params.fixedContributorId ?? source?.contributorId ?? ""),
    year: String(params.fixedYear ?? source?.year ?? params.defaultYear),
    month: String(params.fixedMonth ?? source?.month ?? params.defaultMonth),
    amount: formatCentsAsInputValue(source?.amountCents ?? params.monthlyAmountCents)
  };
};

export const ContributionModal = ({
  open,
  contributors,
  monthlyAmountCents,
  defaultYear,
  defaultMonth,
  initialContribution,
  fixedContributorId,
  fixedYear,
  fixedMonth,
  lockedReason,
  submitting = false,
  onClose,
  onSubmit,
  onDelete
}: ContributionModalProps) => {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState({
      initialContribution,
      defaultYear,
      defaultMonth,
      monthlyAmountCents,
      fixedContributorId,
      fixedMonth
    })
  );
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorId = "contribution-form-error";

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      buildInitialState({
        initialContribution,
        defaultYear,
        defaultMonth,
        monthlyAmountCents,
        fixedContributorId,
        fixedYear,
        fixedMonth
      })
    );
    setFormError(null);
  }, [open, initialContribution, defaultYear, defaultMonth, monthlyAmountCents, fixedContributorId, fixedYear, fixedMonth]);

  const submitLabel = initialContribution ? "Guardar cambios" : "Registrar aporte";
  const canEditContributor = fixedContributorId === undefined;
  const canEditYear = fixedYear === undefined;
  const canEditMonth = fixedMonth === undefined;
  const lockedFieldClassName = "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400";

  const sortedContributors = useMemo(() => {
    return [...contributors].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [contributors]);

  const handleSubmit = async () => {
    setFormError(null);

    if (lockedReason) {
      setFormError(lockedReason);
      return;
    }

    const contributorId = Number(form.contributorId);
    const year = Number(form.year);
    const month = Number(form.month);
    const amountCents = parseMoneyInputToCents(form.amount);

    if (!Number.isInteger(contributorId) || contributorId < 1) {
      setFormError("Selecciona un contribuyente válido.");
      return;
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setFormError("El año debe estar entre 2000 y 2100.");
      return;
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setFormError("El mes debe estar entre 1 y 12.");
      return;
    }

    if (!amountCents || amountCents < 1) {
      setFormError("El monto debe ser mayor a 0.");
      return;
    }

    await onSubmit({
      contributorId,
      year,
      month,
      amountCents
    });
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
              <DialogPanel className="w-full max-w-xl overflow-hidden rounded-[var(--radius-dialog)] border border-border bg-white shadow-dialog transition-all dark:bg-neutral-800">
                <div className="flex items-center gap-3 border-b border-border bg-[var(--gradient-modal-header)] px-5 py-4 sm:gap-4 sm:px-8 sm:py-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-200 bg-primary-50/80 text-primary-700 shadow-sm dark:border-primary-800 dark:bg-primary-900/30 sm:h-10 sm:w-10">
                    <ReceiptText size={18} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                      {initialContribution ? "Edición de Aporte" : "Registro de Aporte"}
                    </DialogTitle>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-6 sm:p-8">
                  <Select
                    label="Contribuyente"
                    value={form.contributorId}
                    onChange={(event) => setForm((previous) => ({ ...previous, contributorId: event.target.value }))}
                    disabled={!canEditContributor || submitting}
                    aria-invalid={formError ? true : undefined}
                    aria-describedby={formError ? formErrorId : undefined}
                    className={!canEditContributor ? lockedFieldClassName : ""}
                  >
                    <option value="">Seleccionar...</option>
                    {sortedContributors.map((contributor) => (
                      <option key={contributor.id} value={contributor.id}>
                        {contributor.name}
                      </option>
                    ))}
                  </Select>

                  <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="Año"
                      type="number"
                      inputMode="numeric"
                      min={2000}
                      max={2100}
                      value={form.year}
                      onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))}
                      disabled={!canEditYear || submitting}
                      aria-invalid={formError ? true : undefined}
                      aria-describedby={formError ? formErrorId : undefined}
                      className={!canEditYear ? lockedFieldClassName : ""}
                    />

                    <Select
                      label="Mes"
                      value={form.month}
                      onChange={(event) => setForm((previous) => ({ ...previous, month: event.target.value }))}
                      disabled={!canEditMonth || submitting}
                      aria-invalid={formError ? true : undefined}
                      aria-describedby={formError ? formErrorId : undefined}
                      className={!canEditMonth ? lockedFieldClassName : ""}
                    >
                      {monthOptions.map((month) => (
                        <option key={month} value={month}>
                          {getMonthLongLabel(month)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Input
                    label={initialContribution ? "Monto aportado" : "Monto a aportar"}
                    type="text"
                    inputMode="decimal"
                    prefix="$"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, amount: sanitizeMoneyInput(event.target.value) }))
                    }
                    disabled={submitting}
                    aria-invalid={formError ? true : undefined}
                    aria-describedby={formError ? formErrorId : undefined}
                  />
                  
                  {(formError || lockedReason) && (
                    <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-alert)] border border-warning-200 bg-warning-100/60 p-3.5 transition-all duration-300 animate-in slide-in-from-top-2 dark:border-warning-700/50 dark:bg-warning-950/40 sm:mb-6 sm:gap-4 sm:p-4">
                       <AlertCircle size={18} className="mt-0.5 shrink-0 text-warning-700" />
                       <p
                         id={formError ? formErrorId : undefined}
                         className="text-xs font-semibold uppercase leading-relaxed tracking-tighter text-warning-950 dark:text-warning-300"
                       >
                          {formError || lockedReason}
                       </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 border-t border-border bg-[var(--gradient-modal-footer)] px-5 py-4 sm:flex-row-reverse sm:justify-between sm:gap-3 sm:px-8 sm:py-6">
                  <div className="flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
                    <Button
                      onClick={handleSubmit}
                      isLoading={submitting}
                      disabled={Boolean(lockedReason)}
                      className="sm:min-w-[160px]"
                    >
                      {submitLabel}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                  {initialContribution && onDelete && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onClick={onDelete}
                        className="border-danger-600 bg-danger-600 text-white hover:border-danger-700 hover:bg-danger-700 dark:border-danger-700 dark:bg-danger-800 dark:text-danger-100 dark:hover:bg-danger-700"
                        disabled={submitting || Boolean(lockedReason)}
                      >
                        Eliminar aporte
                      </Button>
                    </div>
                  )}
                </div>

              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
