import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ContributionModal, type ContributionPayload } from "../components/contributions/contribution-modal";
import { SectionLoader } from "../components/ui/loaders";
import { ContributionStateBadge, ContributorStatusBadge, getContributionCellState } from "../components/ui/state-badge";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributionsYearAll } from "../hooks/use-contributions-year-all";
import { useSummary } from "../hooks/use-summary";
import { getMonthLabel } from "../lib/date";
import { formatCentsAsCurrency } from "../lib/money";
import type { Contribution, SummaryContributor } from "../types/domain";

type SelectedCell = {
  contributor: SummaryContributor;
  month: number;
  existingContribution: Contribution | null;
};

const monthList = Array.from({ length: 12 }, (_, index) => index + 1);

const getCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "incomplete":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "complete":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "overpaid":
      return "border-sky-300 bg-sky-50 text-sky-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const byCellKey = (contributorId: number, month: number): string => `${contributorId}:${month}`;

export const AnnualPage = () => {
  const { activeYear, canMutateCurrentPeriod, contributionRestrictionMessage } = useAppContext();
  const api = useApiClient();

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
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">
        No se pudo cargar el resumen anual: {summary.error}
      </div>
    );
  }

  if (allContributions.error) {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">
        No se pudo cargar el detalle mensual: {allContributions.error}
      </div>
    );
  }

  if (!summary.data) {
    return null;
  }

  const monthlyAmountCents = summary.data.monthlyAmountCents;

  const openModalForCell = (contributor: SummaryContributor, month: number) => {
    const existingContribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;

    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No tienes permisos para editar este período.");
      return;
    }

    if (contributor.status === 0) {
      toast.info("Contribuidor inactivo: no se pueden registrar ni editar aportes.");
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
    summary.reload();
    allContributions.reload();
  };

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Vista anual {summary.data.year}</h2>
        <p className="text-sm text-slate-600">Matriz 12 meses × contribuidores con estado visual por monto.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">Contribuidor</th>
                {monthList.map((month) => (
                  <th key={month} className="px-2 py-3 text-center font-semibold text-slate-700">
                    {getMonthLabel(month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.data.contributors.map((contributor) => (
                <tr key={contributor.contributorId}>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{contributor.name}</span>
                      <ContributorStatusBadge status={contributor.status} />
                    </div>
                    <div className="mt-1">
                      <ContributionStateBadge state={contributor.state} />
                    </div>
                  </td>

                  {monthList.map((month) => {
                    const contribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;
                    const amountCents = contribution?.amountCents ?? 0;
                    const state = getContributionCellState(amountCents, monthlyAmountCents);

                    return (
                      <td key={month} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => openModalForCell(contributor, month)}
                          className={`w-full rounded-lg border px-2 py-2 text-xs font-semibold transition hover:brightness-95 ${getCellStyle(state)} ${
                            canMutateCurrentPeriod && contributor.status === 1 ? "cursor-pointer" : "cursor-not-allowed"
                          }`}
                          disabled={!canMutateCurrentPeriod || contributor.status === 0}
                          title={
                            canMutateCurrentPeriod
                              ? contributor.status === 0
                                ? "Contribuidor inactivo"
                                : "Editar aporte"
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
      </div>

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
        defaultMonth={selectedCell?.month ?? new Date().getMonth() + 1}
        initialContribution={selectedCell?.existingContribution}
        fixedContributorId={selectedCell?.contributor.contributorId}
        fixedMonth={selectedCell?.month}
        lockedReason={
          selectedCell
            ? !canMutateCurrentPeriod
              ? contributionRestrictionMessage
              : selectedCell.contributor.status === 0
                ? "Contribuidor inactivo: no editable."
                : null
            : null
        }
        submitting={submitting}
        onClose={() => setSelectedCell(null)}
        onSubmit={handleSave}
      />
    </section>
  );
};
