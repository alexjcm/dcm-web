import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";

import type { ContributionPayload } from "../components/contributions/contribution-modal";
import { Card } from "../components/ui/card";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { Input } from "../components/ui/fields";
import { Button } from "../components/ui/button";
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
      return "Sin aportes";
    case "incomplete":
      return "Colaborando";
    case "complete":
      return "Meta alcanzada";
    case "overpaid":
      return "Colaborador destacado";
    default:
      return "Sin aportes";
  }
};

const getCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-neutral-300 bg-neutral-50 text-neutral-700";
    case "incomplete":
      return "border-primary-200 bg-primary-50 text-primary-700 shadow-inner";
    case "complete":
      return "border-success-200 bg-success-50 text-success-700 shadow-inner";
    case "overpaid":
      return "border-success-400 bg-success-100 text-success-900 shadow-inner ring-1 ring-success-200/50";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-700";
  }
};

const getMutedCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-neutral-300 bg-neutral-50 text-neutral-500";
    case "incomplete":
      return "border-primary-200 bg-primary-50 text-primary-800";
    case "complete":
      return "border-success-200 bg-success-50 text-success-800";
    case "overpaid":
      return "border-success-400 bg-success-100 text-success-900";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-500";
  }
};

export const ContributionsPage = () => {
  const { activeYear, currentBusinessYear, setActiveYear, canMutateCurrentPeriod, contributionRestrictionMessage } =
    useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const currentBusinessMonth = getCurrentBusinessMonth();
  const isCurrentBusinessYear = activeYear === currentBusinessYear;

  const summary = useSummary(activeYear);
  const allContributions = useContributionsYearAll(activeYear);

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-800 animate-in fade-in">
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

  const visibleContributors = (() => {
    if (!searchQuery.trim()) {
      return contributors;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return contributors.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  })();

  const openGlobalModal = () => {
    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No tienes permisos para editar este período.");
      return;
    }
    setIsGlobalModalOpen(true);
  };

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
    setSubmitting(true);

    const isEdit = selectedCell?.existingContribution;
    const response = isEdit
      ? await api.put<Contribution>(`/api/contributions/${selectedCell.existingContribution!.id}`, payload)
      : await api.post<Contribution>("/api/contributions", payload);

    setSubmitting(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success(isEdit ? "Aporte actualizado." : "Aporte registrado.");
    setSelectedCell(null);
    setIsGlobalModalOpen(false);
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    const response = await api.delete<Contribution>(`/api/contributions/${pendingDelete.id}`);
    setDeleting(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success("Aporte eliminado.");
    setPendingDelete(null);
    setSelectedCell(null);
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-6">
      <header>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-start lg:gap-8 w-full md:w-auto">
            <div className="flex items-center justify-between gap-4 w-full lg:w-auto">
              <h2 className="text-2xl md:text-2xl font-extrabold tracking-tight text-neutral-900 line-clamp-1">Aportes Familiares</h2>
              <YearSelect
                activeYear={activeYear}
                currentBusinessYear={currentBusinessYear}
                setActiveYear={setActiveYear}
                compact
              />
            </div>
            <div className="flex w-full sm:w-auto">
              <Input
                type="text"
                placeholder="Buscar contribuyente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <Button onClick={openGlobalModal} disabled={!canMutateCurrentPeriod}>
              Nuevo Aporte
            </Button>
          </div>
        </div>
      </header>

      <div className="rounded-[1.25rem] border border-primary-200 bg-[linear-gradient(180deg,rgba(219,234,254,0.74),rgba(255,255,255,0.92))] p-4 shadow-[0_14px_30px_rgba(37,99,235,0.06)] md:hidden">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 text-primary-700" />
          <p className="text-xs font-medium leading-relaxed text-primary-900">
           Pulsa cualquier mes para registrar o corregir el aporte de esa celda.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 md:hidden">
        {visibleContributors.map((contributor) => (
          <Card
            key={contributor.contributorId}
            className="overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow border-primary-100 bg-white"
            bodyClassName="p-5"
          >
            <div className="flex items-center justify-between gap-3 border-b border-primary-50 pb-3 mb-4">
              <p className="truncate text-[17px] font-extrabold text-neutral-900">{contributor.name}</p>
              <div className="flex flex-col items-end">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total Pagado</p>
                 <p className="text-sm font-extrabold text-primary-700">{formatCentsAsCurrency(contributor.totalPaidCents)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {monthList.map((month) => {
                const contribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;
                const amountCents = contribution?.amountCents ?? 0;
                const state = getContributionCellState(amountCents, monthlyAmountCents);
                const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;
                const isInteractive = canMutateCurrentPeriod && contributor.status === 1;
                const baseCellStyle =
                  isFutureMonth || !isInteractive ? getMutedCellStyle(state) : getCellStyle(state);

                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => openModalForCell(contributor, month)}
                    className={`flex min-h-[50px] flex-col items-center justify-center rounded-[0.8rem] border px-1 py-1.5 shadow-sm transition-all ${baseCellStyle} ${
                      isCurrentMonth ? "border-primary-400 ring-2 ring-primary-100/50" : ""
                    } ${
                      isInteractive ? "cursor-pointer hover:border-primary-300 hover:ring-2 hover:ring-primary-100" : "cursor-not-allowed"
                    }`}
                    disabled={!isInteractive}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-current">{getMonthLabel(month)}</span>
                      {isCurrentMonth && <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span>}
                    </div>
                    <div className="text-[11px] font-black leading-tight">
                      {amountCents > 0 ? formatCentsAsCurrency(amountCents) : "-"}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card
        className="hidden md:block overflow-hidden border-primary-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.96))]"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[rgba(66,90,111,0.28)]">
          <div className="flex items-center justify-between border-b border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(239,246,255,0.62))] px-5 py-3">
            <p className="text-[13px] font-semibold text-neutral-700">Seguimiento operativo del mes actual</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-success-300 bg-success-100/70"></span>
                  Meta alcanzada
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-primary-300 bg-primary-100/70"></span>
                  Colaborando
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-success-400 bg-success-200/50"></span>
                  Colaborador destacado
                </div>
              </div>
            </div>
          </div>

          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary-50/50">
                <th className="sticky left-0 z-20 border-b border-r border-border bg-[rgba(247,250,255,0.98)] px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600 shadow-sm">
                  Contribuyente
                </th>
                {monthList.map((month) => {
                  const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                  const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;

                  return (
                    <th
                      key={month}
                      className={`border-b border-border px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                        isCurrentMonth ? "bg-primary-100/70 text-primary-800 shadow-[inset_0_2px_0_0_#2563eb]" : "text-neutral-600"
                      } ${isFutureMonth ? "bg-primary-50/40 text-neutral-500" : ""}`}
                    >
                      <span>{getMonthLabel(month)}</span>
                    </th>
                  );
                })}
                <th className="border-b border-border bg-primary-50/80 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-700 shadow-sm">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {visibleContributors.map((contributor) => (
                <tr key={contributor.contributorId} className="group transition-colors hover:bg-primary-50/30">
                  <td className="sticky left-0 z-10 border-r border-border bg-white px-5 py-3 shadow-sm transition-colors group-hover:bg-primary-50/10">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-neutral-900">{contributor.name}</div>
                      </div>
                    </div>
                  </td>

                  {monthList.map((month) => {
                    const contribution = contributionMap.get(byCellKey(contributor.contributorId, month)) ?? null;
                    const amountCents = contribution?.amountCents ?? 0;
                    const state = getContributionCellState(amountCents, monthlyAmountCents);
                    const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                    const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;
                    const isInteractive = canMutateCurrentPeriod && contributor.status === 1;
                    const baseCellStyle =
                      isFutureMonth || !isInteractive ? getMutedCellStyle(state) : getCellStyle(state);

                    return (
                      <td
                        key={month}
                        className={`px-1.5 py-2.5 ${isCurrentMonth ? "bg-primary-50/40" : ""} ${isFutureMonth ? "bg-primary-50/30" : ""}`}

                      >
                        <button
                          type="button"
                          onClick={() => openModalForCell(contributor, month)}
                          className={`w-full min-h-[44px] rounded-xl border px-2 py-2 text-[11px] font-extrabold shadow-sm transition-all ${baseCellStyle} ${
                            isCurrentMonth ? "border-primary-300 ring-2 ring-primary-100" : ""
                          } ${
                            isInteractive
                              ? "cursor-pointer hover:border-primary-300 hover:ring-2 hover:ring-primary-100"
                              : "cursor-not-allowed"
                          }`}
                          disabled={!isInteractive}
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
                  <td className="bg-primary-50/20 px-4 py-3 text-right font-extrabold text-neutral-900 group-hover:bg-primary-50/40">
                    {formatCentsAsCurrency(contributor.totalPaidCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="md:hidden flex items-center gap-6 overflow-x-auto whitespace-nowrap rounded-[1.2rem] border border-border bg-white p-4 text-[11px] font-bold uppercase tracking-widest text-neutral-500 shadow-sm scrollbar-hide">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-success-300 bg-success-100/70"></span>
          Alcanzada
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-primary-300 bg-primary-100/70"></span>
          Colaborando
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-success-400 bg-success-200/50"></span>
          Colaborador destacado
        </div>
      </div>

      {selectedCell || isGlobalModalOpen ? (
        <Suspense fallback={null}>
          <ContributionModal
            open={Boolean(selectedCell) || isGlobalModalOpen}
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
            defaultMonth={selectedCell ? selectedCell.month : currentBusinessMonth}
            initialContribution={selectedCell?.existingContribution ?? null}
            fixedContributorId={selectedCell?.contributor.contributorId}
            fixedYear={activeYear}
            fixedMonth={selectedCell?.month}
            lockedReason={
              !canMutateCurrentPeriod
                ? contributionRestrictionMessage
                : selectedCell && selectedCell.contributor.status === 0
                  ? "Contribuyente inactivo: no editable."
                  : null
            }
            submitting={submitting}
            onClose={() => {
              setSelectedCell(null);
              setIsGlobalModalOpen(false);
            }}
            onSubmit={handleSave}
            onDelete={selectedCell?.existingContribution ? () => setPendingDelete(selectedCell.existingContribution!) : undefined}
          />
        </Suspense>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Eliminar aporte"
        description={
          pendingDelete
            ? `¿Estás seguro que deseas eliminar el aporte correspondiente a ${getMonthLabel(pendingDelete.month)}/${pendingDelete.year}? Esta acción borrará el registro de la base de datos de este mes.`
            : ""
        }
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <Button
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.24)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] md:hidden flex items-center justify-center p-0"
        onClick={openGlobalModal}
        disabled={!canMutateCurrentPeriod}
        aria-label="Nuevo Aporte"
      >
        <span className="text-3xl leading-none -mt-1">+</span>
      </Button>

 
    </div>
  );
};
