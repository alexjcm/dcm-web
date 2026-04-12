import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";

import type { Contribution, Contributor } from "../../types/domain";
import { formatCentsAsInputValue, parseMoneyInputToCents } from "../../lib/money";

export type ContributionPayload = {
  contributorId: number;
  year: number;
  month: number;
  amountCents: number;
  paidAt: string | null;
  notes: string | null;
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
  paidAt: string;
  notes: string;
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
    amount: formatCentsAsInputValue(source?.amountCents ?? params.monthlyAmountCents),
    paidAt: source?.paidAt ?? "",
    notes: source?.notes ?? ""
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
      setFormError("Selecciona un contribuidor válido.");
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

    if (form.paidAt && !/^\d{4}-\d{2}-\d{2}$/.test(form.paidAt)) {
      setFormError("La fecha de pago debe tener formato YYYY-MM-DD.");
      return;
    }

    await onSubmit({
      contributorId,
      year,
      month,
      amountCents,
      paidAt: form.paidAt || null,
      notes: form.notes.trim() ? form.notes.trim() : null
    });
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={submitting ? () => undefined : onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {initialContribution ? "Editar aporte" : "Registrar aporte"}
                </DialogTitle>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Contribuidor</span>
                    <select
                      value={form.contributorId}
                      onChange={(event) => setForm((previous) => ({ ...previous, contributorId: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      disabled={!canEditContributor || submitting}
                    >
                      <option value="">Seleccionar...</option>
                      {sortedContributors.map((contributor) => (
                        <option key={contributor.id} value={contributor.id}>
                          {contributor.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Año</span>
                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      value={form.year}
                      onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      disabled={submitting}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Mes</span>
                    <select
                      value={form.month}
                      onChange={(event) => setForm((previous) => ({ ...previous, month: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      disabled={!canEditMonth || submitting}
                    >
                      {monthOptions.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Monto (USD)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.amount}
                      onChange={(event) => setForm((previous) => ({ ...previous, amount: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      disabled={submitting}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Fecha de pago (opcional)</span>
                    <input
                      type="date"
                      value={form.paidAt}
                      onChange={(event) => setForm((previous) => ({ ...previous, paidAt: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      disabled={submitting}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">Notas (opcional)</span>
                    <textarea
                      value={form.notes}
                      onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
                      className="min-h-24 rounded-lg border border-slate-300 px-3 py-2"
                      maxLength={500}
                      disabled={submitting}
                    />
                  </label>
                </div>

                {formError ? <p className="mt-3 text-sm font-medium text-rose-700">{formError}</p> : null}
                {lockedReason ? <p className="mt-3 text-sm font-medium text-amber-700">{lockedReason}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={submitting || Boolean(lockedReason)}
                  >
                    {submitting ? "Guardando..." : submitLabel}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
