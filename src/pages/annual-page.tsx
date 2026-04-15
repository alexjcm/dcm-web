import { useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  CalendarDays, 
  User, 
  ChevronRight,
  Info
} from "lucide-react";

import { ContributionModal, type ContributionPayload } from "../components/contributions/contribution-modal";
import { SectionLoader } from "../components/ui/loaders";
import { ContributionStateBadge, ContributorStatusBadge, getContributionCellState } from "../components/ui/state-badge";
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
import { Card } from "../components/ui/card";

type SelectedCell = {
  contributor: SummaryContributor;
  month: number;
  existingContribution: Contribution | null;
};

const monthList = Array.from({ length: 12 }, (_, index) => index + 1);

const getCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-slate-200 bg-slate-50 text-slate-400";
    case "incomplete":
      return "border-amber-200 bg-amber-50 text-amber-700 shadow-inner shadow-amber-100/50";
    case "complete":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-inner shadow-emerald-100/50";
    case "overpaid":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-inner shadow-indigo-100/50";
    default:
      return "border-slate-200 bg-slate-50 text-slate-400";
  }
};

const byCellKey = (contributorId: number, month: number): string => `${contributorId}:${month}`;

export const AnnualPage = () => {
  const { activeYear, canMutateCurrentPeriod, contributionRestrictionMessage } = useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

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
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          Matriz de Seguimiento
          <ChevronRight size={12} />
          {summary.data.year}
        </div>
        <div className="flex items-baseline gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Vista Anual</h2>
            <p className="text-sm text-slate-500">Proyección y control mensual de aportaciones por unidad familiar.</p>
          </div>
        </div>
      </header>
      
      <div className="lg:hidden p-4 rounded-xl border border-primary-100 bg-primary-50/50 flex items-start gap-3">
         <Info size={18} className="text-primary-600 mt-0.5" />
         <p className="text-xs font-medium text-primary-800 leading-relaxed">
           Desliza horizontalmente la tabla para ver todos los meses. Puedes pulsar en cada celda para ver o editar el detalle.
         </p>
      </div>

      <Card bodyClassName="p-0">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-100 px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  Contribuidor
                </th>
                {monthList.map((month) => (
                  <th key={month} className="border-b border-slate-100 px-2 py-4 text-center font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                    {getMonthLabel(month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.data.contributors.map((contributor) => (
                <tr key={contributor.contributorId} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white border-r border-slate-100 px-6 py-4 shadow-[2px_0_5px_rgba(0,0,0,0.02)] group-hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                          {contributor.name.charAt(0)}
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{contributor.name}</span>
                            <ContributorStatusBadge status={contributor.status} />
                          </div>
                          <ContributionStateBadge state={contributor.state} />
                       </div>
                    </div>
                  </td>

                  {monthList.map((month) => {
                    const contribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;
                    const amountCents = contribution?.amountCents ?? 0;
                    const state = getContributionCellState(amountCents, monthlyAmountCents);

                    return (
                      <td key={month} className="px-1.5 py-3">
                        <button
                          type="button"
                          onClick={() => openModalForCell(contributor, month)}
                          className={`w-full min-h-[48px] rounded-lg border px-2 py-2 text-[11px] font-extrabold transition-all group-hover:scale-[1.02] ${getCellStyle(state)} ${
                            canMutateCurrentPeriod && contributor.status === 1 ? "cursor-pointer hover:border-primary-300 hover:ring-2 hover:ring-primary-100" : "cursor-not-allowed opacity-60"
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
      </Card>
      
      <div className="flex items-center gap-8 p-6 rounded-2xl border border-slate-100 bg-white/50 text-[11px] font-bold uppercase tracking-widest text-slate-500 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
         <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-200"></span>
            Completo
         </div>
         <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-amber-50 border border-amber-200"></span>
            Incompleto
         </div>
         <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-indigo-50 border border-indigo-200"></span>
            Excedente
         </div>
         <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-slate-50 border border-slate-200"></span>
            Pendiente
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
        defaultMonth={selectedCell?.month ?? getCurrentBusinessMonth()}
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
    </div>
  );
};

