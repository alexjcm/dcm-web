import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from "@headlessui/react";
import { Fragment, useEffect, useId, useMemo, useState } from "react";
import { ReceiptText, AlertCircle, Check, ChevronDown, Trash2 } from "lucide-react";

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
  minYear: number;
  currentBusinessYear: number;
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

const getYearOptions = (currentBusinessYear: number, minYear: number): number[] => {
  const years: number[] = [];

  for (let year = currentBusinessYear; year >= minYear; year -= 1) {
    years.push(year);
  }

  return years;
};

type ContributorPickerProps = {
  contributors: Contributor[];
  value: string;
  disabled: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
};

const ContributorPicker = ({
  contributors,
  value,
  disabled,
  invalid,
  describedBy,
  onChange
}: ContributorPickerProps) => {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const selectedContributor = contributors.find((contributor) => String(contributor.id) === value) ?? null;
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredContributors = useMemo(() => {
    if (!normalizedQuery) {
      return contributors;
    }

    return contributors.filter((contributor) => contributor.name.toLocaleLowerCase("es").includes(normalizedQuery));
  }, [contributors, normalizedQuery]);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold tracking-[0.01em] text-neutral-700 dark:text-neutral-300">
        Contribuyente
      </label>
      <Combobox
        value={value}
        disabled={disabled}
        immediate
        onChange={(nextValue) => {
          onChange(nextValue ?? "");
          setQuery("");
        }}
      >
        <div className="relative">
          <ComboboxInput
            id={inputId}
            displayValue={() => selectedContributor?.name ?? ""}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar contribuyente..."
            autoComplete="off"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={`min-h-11 w-full rounded-xl border bg-white px-3 py-2.5 pr-10 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 ${
              invalid
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                : "border-border focus:border-primary-400 focus:ring-primary-400"
            }`}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-500 transition hover:text-primary-700 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:text-primary-300">
            <ChevronDown size={18} aria-hidden="true" />
            <span className="sr-only">Mostrar contribuyentes</span>
          </ComboboxButton>
          <ComboboxOptions className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-[var(--shadow-dropdown)] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800">
            {filteredContributors.length > 0 ? (
              filteredContributors.map((contributor) => {
                const contributorId = String(contributor.id);

                return (
                  <ComboboxOption
                    key={contributor.id}
                    value={contributorId}
                    className="group flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 data-[focus]:bg-primary-50 data-[focus]:text-primary-800 dark:text-neutral-200 dark:data-[focus]:bg-primary-900/40 dark:data-[focus]:text-primary-200"
                  >
                    <span className="truncate">{contributor.name}</span>
                    <Check
                      size={16}
                      aria-hidden="true"
                      className={`shrink-0 text-primary-600 ${value === contributorId ? "opacity-100" : "opacity-0"}`}
                    />
                  </ComboboxOption>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                No se encontraron contribuyentes.
              </p>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
};

type ReadOnlyFieldProps = {
  label: string;
  value: string;
};

const ReadOnlyField = ({ label, value }: ReadOnlyFieldProps) => {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <span className="text-sm font-semibold tracking-[0.01em] text-neutral-700 dark:text-neutral-300">{label}</span>
      <p className="flex min-h-11 items-center rounded-xl border border-border bg-neutral-100 px-3 py-2.5 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
        {value}
      </p>
    </div>
  );
};

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
  minYear,
  currentBusinessYear,
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
  const yearOptions = useMemo(() => getYearOptions(currentBusinessYear, minYear), [currentBusinessYear, minYear]);

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

    if (!yearOptions.includes(year)) {
      setFormError("Selecciona un año disponible.");
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
          <div className="fixed inset-0 bg-neutral-900/32" />
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
              <DialogPanel className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-[var(--radius-dialog)] border border-border bg-white shadow-dialog transition-[opacity,transform] dark:bg-neutral-800">
                <div className="flex items-center gap-3 border-b border-border bg-[var(--surface-modal)] px-5 py-4 sm:gap-4 sm:px-8 sm:py-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-200 bg-primary-50/80 text-primary-700 shadow-sm dark:border-primary-800 dark:bg-primary-900/30 sm:h-10 sm:w-10">
                    <ReceiptText size={18} />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                      {initialContribution ? "Editar aporte" : "Registrar aporte"}
                    </DialogTitle>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-6 sm:p-8">
                  {canEditContributor ? (
                    <ContributorPicker
                      contributors={sortedContributors}
                      value={form.contributorId}
                      disabled={submitting}
                      invalid={Boolean(formError)}
                      describedBy={formError ? formErrorId : undefined}
                      onChange={(contributorId) => setForm((previous) => ({ ...previous, contributorId }))}
                    />
                  ) : (
                    <ReadOnlyField label="Contribuyente" value={sortedContributors.find((contributor) => contributor.id === Number(form.contributorId))?.name ?? "Contribuyente"} />
                  )}

                  <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
                    {canEditYear ? (
                      <Select
                        label="Año"
                        value={form.year}
                        onChange={(event) => setForm((previous) => ({ ...previous, year: event.target.value }))}
                        disabled={submitting}
                        aria-invalid={formError ? true : undefined}
                        aria-describedby={formError ? formErrorId : undefined}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <ReadOnlyField label="Año" value={form.year} />
                    )}

                    {canEditMonth ? (
                      <Select
                        label="Mes"
                        value={form.month}
                        onChange={(event) => setForm((previous) => ({ ...previous, month: event.target.value }))}
                        disabled={submitting}
                        aria-invalid={formError ? true : undefined}
                        aria-describedby={formError ? formErrorId : undefined}
                      >
                        {monthOptions.map((month) => (
                          <option key={month} value={month}>
                            {getMonthLongLabel(month)}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <ReadOnlyField label="Mes" value={getMonthLongLabel(Number(form.month))} />
                    )}
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
                    className="font-semibold"
                  />
                  
                  {(formError || lockedReason) && (
                    <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-alert)] border border-warning-200 bg-warning-100/60 p-3.5 transition-[opacity,transform] duration-300 animate-in slide-in-from-top-2 dark:border-warning-700/50 dark:bg-warning-950/40 sm:mb-6 sm:gap-4 sm:p-4">
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

                <div className="flex flex-col gap-2.5 border-t border-border bg-[var(--surface-footer)] px-5 py-4 sm:flex-row-reverse sm:justify-between sm:gap-3 sm:px-8 sm:py-6">
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
