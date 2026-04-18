import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ChevronRight, Info } from "lucide-react";

import type { ContributionPayload } from "../components/contributions/contribution-modal";
import { Card } from "../components/ui/card";
import { SectionLoader } from "../components/ui/loaders";
import { getContributionCellState } from "../components/ui/state-badge";
import { YearSelect } from "../components/ui/year-select";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributionsYearAll } from "../hooks/use-contributions-year-all";
import { useInvalidateResources } from "../hooks/use-resource-invalidation";
import { useSummary } from "../hooks/use-summary";
import { getCurrentBusinessMonth } from "../lib/business-time";
import { getMonthLabel } from "../lib/date";
import { formatCentsAsCurrency } from "../lib/money";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contribution, SummaryContributor } from "../types/domain";

type SelectedCell = {
  contributor: SummaryContributor;
  month: number;
  existingContribution: Contribution | null;
};

const ContributionModal = lazy(async () => {
  const module = await import("../components/contributions/contribution-modal");
  return { default: module.ContributionModal };
});

const monthList = Array.from({ length: 12 }, (_, index) => index + 1);

const byCellKey = (contributorId: number, month: number): string => `${contributorId}:${month}`;

const getStatePriority = (state: ReturnType<typeof getContributionCellState>): number => {
  switch (state) {
    case "pending":
      return 0;
    case "incomplete":
      return 1;
    case "overpaid":
      return 2;
    case "complete":
      return 3;
    default:
      return 4;
  }
};

const getStateLabel = (state: SummaryContributor["state"]): string => {
  switch (state) {
    case "pending":
      return "Pendiente";
    case "incomplete":
      return "Incompleto";
    case "complete":
      return "Completo";
    case "overpaid":
      return "Excedente";
    default:
      return "Pendiente";
  }
};

const getCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-slate-300 bg-slate-50 text-slate-700";
    case "incomplete":
      return "border-amber-200 bg-amber-50 text-amber-700 shadow-inner shadow-amber-100/50";
    case "complete":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-inner shadow-emerald-100/50";
    case "overpaid":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-inner shadow-indigo-100/50";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
  }
};

export const AnnualPage = () => {
  const { activeYear, currentBusinessYear, setActiveYear, canMutateCurrentPeriod, contributionRestrictionMessage } =
    useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const currentBusinessMonth = getCurrentBusinessMonth();
  const isCurrentBusinessYear = activeYear === currentBusinessYear;

  const summary = useSummary(activeYear);
  const allContributions = useContributionsYearAll(activeYear);

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const contributionMap = useMemo(() => {
    const map = new Map<string, Contribution>();

    for (const item of allContributions.data?.items ?? []) {
      map.set(byCellKey(item.contributorId, item.month), item);
    }

    return map;
  }, [allContributions.data]);

  if ((summary.loading && !summary.data) || (allContributions.loading && !allContributions.data)) {
    return <SectionLoader label="Cargando vista anual..." />;
  }

  if (summary.error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in">
        No se pudo cargar el resumen anual: {summary.error}
      </div>
    );
  }

  if (allContributions.error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in">
        No se pudo cargar el detalle mensual: {allContributions.error}
      </div>
    );
  }

  if (!summary.data) {
    return null;
  }

  const monthlyAmountCents = summary.data.monthlyAmountCents;
  const contributors = [...summary.data.contributors].sort((left, right) => {
    const leftCurrentAmount = contributionMap.get(byCellKey(left.contributorId, currentBusinessMonth))?.amountCents ?? 0;
    const rightCurrentAmount = contributionMap.get(byCellKey(right.contributorId, currentBusinessMonth))?.amountCents ?? 0;

    const leftCurrentState = getContributionCellState(leftCurrentAmount, monthlyAmountCents);
    const rightCurrentState = getContributionCellState(rightCurrentAmount, monthlyAmountCents);

    const stateDiff = getStatePriority(leftCurrentState) - getStatePriority(rightCurrentState);
    if (stateDiff !== 0) {
      return stateDiff;
    }

    if (left.status !== right.status) {
      return right.status - left.status;
    }

    return left.name.localeCompare(right.name, "es");
  });

  const currentMonthPendingCount = contributors.filter((contributor) => {
    const amountCents = contributionMap.get(byCellKey(contributor.contributorId, currentBusinessMonth))?.amountCents ?? 0;
    return getContributionCellState(amountCents, monthlyAmountCents) === "pending" && contributor.status === 1;
  }).length;

  const currentMonthIncompleteCount = contributors.filter((contributor) => {
    const amountCents = contributionMap.get(byCellKey(contributor.contributorId, currentBusinessMonth))?.amountCents ?? 0;
    return getContributionCellState(amountCents, monthlyAmountCents) === "incomplete" && contributor.status === 1;
  }).length;

  const openModalForCell = (contributor: SummaryContributor, month: number) => {
    const existingContribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;

    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No tienes permisos para editar este período.");
      return;
    }

    if (contributor.status === 0) {
      toast.info("Contribuyente inactivo: no se pueden registrar ni editar aportes.");
      return;
    }

    setSelectedCell({ contributor, month, existingContribution });
  };

  const handleSave = async (payload: ContributionPayload) => {
    if (!selectedCell) {
      return;
    }

    setSubmitting(true);

    const response = selectedCell.existingContribution
      ? await api.put<Contribution>(`/api/contributions/${selectedCell.existingContribution.id}`, payload)
      : await api.post<Contribution>("/api/contributions", payload);

    setSubmitting(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success(selectedCell.existingContribution ? "Aporte actualizado." : "Aporte registrado.");
    setSelectedCell(null);
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-baseline gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
                <CalendarDays size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Seguimiento Anual</h2>
                <p className="text-sm text-slate-500">
                  Control del año completo para detectar pendientes e incompletos y corregirlos rápido.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-600">La eliminación de aportes se realiza desde Registro.</p>
              </div>
            </div>
          </div>
          <YearSelect
            activeYear={activeYear}
            currentBusinessYear={currentBusinessYear}
            setActiveYear={setActiveYear}
            compact
          />
        </div>
      </header>

      <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4 md:hidden">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 text-primary-600" />
          <p className="text-xs font-medium leading-relaxed text-primary-800">
            En móvil cada contribuyente se muestra como tarjeta con sus 12 meses. Pulsa cualquier mes para registrar o corregir rápidamente el aporte de esa celda. Si necesitas eliminarlo, usa Registro.
          </p>
        </div>
      </div>

      <Card bodyClassName="p-0">
        <div className="grid gap-3 p-4 md:hidden">
          {contributors.map((contributor) => (
            <article key={contributor.contributorId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{contributor.name}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">{getStateLabel(contributor.state)}</p>
                            </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{formatCentsAsCurrency(contributor.totalPaidCents)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {monthList.map((month) => {
                  const contribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;
                  const amountCents = contribution?.amountCents ?? 0;
                  const state = getContributionCellState(amountCents, monthlyAmountCents);
                  const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                  const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;

                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => openModalForCell(contributor, month)}
                      className={`rounded-xl border px-2 py-2.5 text-center transition-all ${getCellStyle(state)} ${
                        isCurrentMonth ? "border-primary-300 ring-2 ring-primary-100" : ""
                      } ${isFutureMonth ? "opacity-45" : ""} ${
                        canMutateCurrentPeriod && contributor.status === 1 ? "hover:border-primary-300 hover:ring-2 hover:ring-primary-100" : "opacity-60"
                      }`}
                      disabled={!canMutateCurrentPeriod || contributor.status === 0}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wide text-current">
                        {getMonthLabel(month)}
                        {isCurrentMonth ? " • hoy" : ""}
                      </div>
                      <div className="mt-1 text-[11px] font-extrabold leading-tight">
                        {amountCents > 0 ? formatCentsAsCurrency(amountCents) : "-"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 md:block">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-2.5">
            <p className="text-[13px] font-semibold text-slate-600">Seguimiento operativo del mes actual</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                Pendientes: {currentMonthPendingCount}
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                Incompletos: {currentMonthIncompleteCount}
              </span>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-emerald-200 bg-emerald-50"></span>
                  Completo
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-amber-200 bg-amber-50"></span>
                  Incompleto
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-indigo-200 bg-indigo-50"></span>
                  Excedente
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-slate-200 bg-slate-50"></span>
                  Pendiente
                </div>
              </div>
            </div>
          </div>

          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="sticky left-0 z-20 border-b border-r border-slate-100 bg-slate-50 px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  Contribuyente
                </th>
                {monthList.map((month) => {
                  const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                  const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;

                  return (
                    <th
                      key={month}
                      className={`border-b border-slate-100 px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                        isCurrentMonth ? "bg-primary-50 text-primary-700" : "text-slate-600"
                      } ${isFutureMonth ? "opacity-55" : ""}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{getMonthLabel(month)}</span>
                        {isCurrentMonth ? (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">
                            Actual
                          </span>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {contributors.map((contributor) => (
                <tr key={contributor.contributorId} className="group transition-colors hover:bg-slate-50/30">
                  <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-5 py-3 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{contributor.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{getStateLabel(contributor.state)}</div>
                      </div>
                    </div>
                  </td>

                  {monthList.map((month) => {
                    const contribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;
                    const amountCents = contribution?.amountCents ?? 0;
                    const state = getContributionCellState(amountCents, monthlyAmountCents);
                    const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                    const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;

                    return (
                      <td
                        key={month}
                        className={`px-1.5 py-2.5 ${isCurrentMonth ? "bg-primary-50/40" : ""} ${isFutureMonth ? "opacity-60" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => openModalForCell(contributor, month)}
                          className={`w-full min-h-[44px] rounded-lg border px-2 py-2 text-[11px] font-extrabold transition-all ${getCellStyle(state)} ${
                            isCurrentMonth ? "border-primary-300 ring-2 ring-primary-100" : ""
                          } ${
                            canMutateCurrentPeriod && contributor.status === 1
                              ? "cursor-pointer hover:border-primary-300 hover:ring-2 hover:ring-primary-100"
                              : "cursor-not-allowed opacity-60"
                          }`}
                          disabled={!canMutateCurrentPeriod || contributor.status === 0}
                          aria-label={
                            canMutateCurrentPeriod
                              ? contributor.status === 0
                                ? "Contribuyente inactivo"
                                : "Registrar o corregir aporte"
                              : contributionRestrictionMessage ?? "No editable"
                          }
                          title={
                            canMutateCurrentPeriod
                              ? contributor.status === 0
                                ? "Contribuyente inactivo"
                                : isCurrentMonth
                                  ? "Registrar o corregir aporte del mes actual"
                                  : "Registrar o corregir aporte"
                              : contributionRestrictionMessage ?? "No editable"
                          }
                        >
                          {amountCents > 0 ? formatCentsAsCurrency(amountCents) : "-"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="md:hidden flex items-center gap-6 overflow-x-auto whitespace-nowrap rounded-2xl border border-slate-100 bg-white/60 p-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 shadow-sm scrollbar-hide">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-emerald-200 bg-emerald-50"></span>
          Completo
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-amber-200 bg-amber-50"></span>
          Incompleto
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-indigo-200 bg-indigo-50"></span>
          Excedente
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-slate-200 bg-slate-50"></span>
          Pendiente
        </div>
      </div>

      {selectedCell ? (
        <Suspense fallback={null}>
          <ContributionModal
            open={Boolean(selectedCell)}
            contributors={summary.data.contributors
              .filter((item) => item.status === 1)
              .map((item) => ({
                id: item.contributorId,
                name: item.name,
                email: item.email,
                status: item.status,
                createdAt: "",
                createdBy: "",
                updatedAt: "",
                updatedBy: ""
              }))}
            monthlyAmountCents={monthlyAmountCents}
            defaultYear={activeYear}
            defaultMonth={selectedCell.month}
            initialContribution={selectedCell.existingContribution}
            fixedContributorId={selectedCell.contributor.contributorId}
            fixedMonth={selectedCell.month}
            lockedReason={
              !canMutateCurrentPeriod
                ? contributionRestrictionMessage
                : selectedCell.contributor.status === 0
                  ? "Contribuyente inactivo: no editable."
                  : null
            }
            submitting={submitting}
            onClose={() => setSelectedCell(null)}
            onSubmit={handleSave}
          />
        </Suspense>
      ) : null}
    </div>
  );
};
