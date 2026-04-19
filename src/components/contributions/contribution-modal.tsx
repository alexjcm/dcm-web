import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ReceiptText, AlertCircle } from "lucide-react";

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
              <DialogPanel className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-dialog transition-all">
                <div className="flex items-center gap-4 border-b border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(239,246,255,0.6))] px-8 py-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-50/80 text-primary-700 shadow-sm">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-extrabold text-neutral-900">
                      {initialContribution ? "Edición de Aporte" : "Registro de Aporte"}
                    </DialogTitle>
                  </div>
                </div>

                <div className="grid gap-6 p-8 sm:grid-cols-2">
                  <Select
                    label="Contribuyente"
                    value={form.contributorId}
                    onChange={(event) => setForm((previous) => ({ ...previous, contributorId: event.target.value }))}
                    disabled={!canEditContributor || submitting}
                  >
                    <option value="">Seleccionar...</option>
                    {sortedContributors.map((contributor) => (
                      <option key={contributor.id} value={contributor.id}>
                        {contributor.name}
                      </option>
                    ))}
                  </Select>

                  <div className="sm:col-span-2 grid gap-4 grid-cols-2">
                    <Input
                      label="Año"
                      type="number"
                      min={2000}
                      max={2100}
                      value={form.year}
                      onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))}
                      disabled={!canEditYear || submitting}
                    />

                    <Select
                      label="Mes"
                      value={form.month}
                      onChange={(event) => setForm((previous) => ({ ...previous, month: event.target.value }))}
                      disabled={!canEditMonth || submitting}
                    >
                      {monthOptions.map((month) => (
                        <option key={month} value={month}>
                          {getMonthLongLabel(month)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Input
                    label="Monto a aportar (USD)"
                    type="text"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, amount: sanitizeMoneyInput(event.target.value) }))
                    }
                    disabled={submitting}
                  />
                  
                  {(formError || lockedReason) && (
                    <div className="sm:col-span-2 flex items-start gap-3 rounded-[1.15rem] border border-warning-300 bg-warning-100/60 p-4">
                       <AlertCircle size={18} className="mt-0.5 shrink-0 text-warning-700" />
                       <p className="text-xs font-semibold uppercase leading-relaxed tracking-tighter text-warning-950">
                          {formError || lockedReason}
                       </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(239,246,255,0.5))] px-8 py-6 sm:flex-row-reverse sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row-reverse">
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
                        variant="ghost"
                        onClick={onDelete}
                        disabled={submitting || Boolean(lockedReason)}
                        className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                      >
                        Eliminar pago
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
