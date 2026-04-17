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
  fixedMonth?: number;
  lockedReason?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: ContributionPayload) => Promise<void>;
};

type FormState = {
  contributorId: string;
  year: string;
  month: string;
  amount: string;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const buildInitialState = (
  params: Pick<ContributionModalProps, "initialContribution" | "defaultYear" | "defaultMonth" | "monthlyAmountCents" | "fixedContributorId" | "fixedMonth">
): FormState => {
  const source = params.initialContribution;

  return {
    contributorId: String(params.fixedContributorId ?? source?.contributorId ?? ""),
    year: String(source?.year ?? params.defaultYear),
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
  fixedMonth,
  lockedReason,
  submitting = false,
  onClose,
  onSubmit
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
        fixedMonth
      })
    );
    setFormError(null);
  }, [open, initialContribution, defaultYear, defaultMonth, monthlyAmountCents, fixedContributorId, fixedMonth]);

  const submitLabel = initialContribution ? "Guardar cambios" : "Registrar aporte";
  const canEditContributor = fixedContributorId === undefined;
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
              <DialogPanel className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-extrabold text-slate-900">
                      {initialContribution ? "Edición de Aporte" : "Registro de Aporte"}
                    </DialogTitle>
                  </div>
                </div>

                <div className="p-8 grid gap-6 sm:grid-cols-2">
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

                  <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Año"
                      type="number"
                      min={2000}
                      max={2100}
                      value={form.year}
                      onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))}
                      disabled={submitting}
                    />

                    <Select
                      label="Mes Correspondiente"
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
                    label="Monto Pagado (USD)"
                    type="text"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, amount: sanitizeMoneyInput(event.target.value) }))
                    }
                    disabled={submitting}
                  />
                  
                  {(formError || lockedReason) && (
                    <div className="sm:col-span-2 flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                       <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                       <p className="text-xs font-semibold text-amber-900 leading-relaxed uppercase tracking-tighter">
                          {formError || lockedReason}
                       </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-slate-100">
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
                    Descartar
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
