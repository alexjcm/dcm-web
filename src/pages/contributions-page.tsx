import { lazy, Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card } from "../components/ui/card";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { Input } from "../components/ui/fields";
import { Button } from "../components/ui/button";
import { SectionLoader } from "../components/ui/loaders";
import { ScreenHelpButton } from "../components/ui/screen-help-button";
import { getContributionCellState } from "../components/ui/state-badge";
import { YearSelect } from "../components/ui/year-select";
import { useAppContext } from "../context/app-context";
import { useContributionsPageActions } from "../hooks/use-contributions-page-actions";
import { useContributionsYearAll } from "../hooks/use-contributions-year-all";
import { byContributionCellKey, useContributionsPageDerived } from "../hooks/use-contributions-page-derived";
import { useContributionsMeta } from "../hooks/use-contributions-meta";
import { getCurrentBusinessMonth } from "../lib/business-time";
import { getMonthLabel } from "../lib/date";
import { formatCentsAsCurrency } from "../lib/money";
import { APP_PERMISSIONS } from "../config/permissions";

const ContributionModal = lazy(async () => {
  const module = await import("../components/contributions/contribution-modal");
  return { default: module.ContributionModal };
});

const monthList = Array.from({ length: 12 }, (_, index) => index + 1);

const getCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500";
    case "incomplete":
      return "border-primary-200 bg-primary-50 text-primary-700 shadow-inner dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300";
    case "complete":
      return "border-success-200 bg-success-50 text-success-700 shadow-inner dark:border-success-800 dark:bg-success-900/40 dark:text-success-300";
    case "overpaid":
      return "border-success-400 bg-success-100 text-success-900 shadow-inner ring-1 ring-success-200/50 dark:border-success-600 dark:bg-success-900/60 dark:text-success-200";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500";
  }
};

const getMutedCellStyle = (state: ReturnType<typeof getContributionCellState>): string => {
  switch (state) {
    case "pending":
      return "border-neutral-300 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-600";
    case "incomplete":
      return "border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-400";
    case "complete":
      return "border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-900/30 dark:text-success-400";
    case "overpaid":
      return "border-success-400 bg-success-100 text-success-900 dark:border-success-600 dark:bg-success-900/50 dark:text-success-300";
    default:
      return "border-neutral-300 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-600";
  }
};

const getFutureCellStyle = (): string =>
  "border-dashed border-neutral-300 bg-neutral-100/70 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-500";

export const ContributionsPage = () => {
  const { activeYear, currentBusinessYear, setActiveYear, canMutateCurrentPeriod, contributionRestrictionMessage, hasPermission } =
    useAppContext();

  const currentBusinessMonth = getCurrentBusinessMonth();
  const isCurrentBusinessYear = activeYear === currentBusinessYear;

  const meta = useContributionsMeta(activeYear);
  const allContributions = useContributionsYearAll(activeYear);

  const [searchQuery, setSearchQuery] = useState("");
 
  const canEditContributions = hasPermission(APP_PERMISSIONS.contributionsWrite);
  const [expandedContributorId, setExpandedContributorId] = useState<number | null>(null);
  const contributorItems = meta.data?.contributors ?? [];
  const monthlyAmountCents = meta.data?.monthlyAmountCents ?? 0;
  const { contributionMap, visibleContributors, modalContributors } = useContributionsPageDerived({
    contributions: allContributions.data?.items,
    contributors: contributorItems,
    currentBusinessMonth,
    monthlyAmountCents,
    searchQuery
  });
  const {
    selectedCell,
    isGlobalModalOpen,
    submitting,
    pendingDelete,
    deleting,
    openGlobalModal,
    openModalForCell,
    closeContributionModal,
    requestDeleteSelectedContribution,
    cancelDelete,
    handleSave,
    handleDelete
  } = useContributionsPageActions({
    canMutateCurrentPeriod,
    contributionRestrictionMessage,
    contributionMap,
    getCellKey: byContributionCellKey
  });

  if ((meta.loading && !meta.data) || (allContributions.loading && !allContributions.data)) {
    return <SectionLoader label="Cargando vista anual..." />;
  }

  if (meta.error) {
    return (
      <div className="rounded-[var(--radius-alert)] border border-danger-300 bg-danger-100 p-4 text-sm font-bold text-danger-900 animate-in fade-in dark:border-danger-800 dark:bg-danger-900 dark:text-danger-50">
        No se pudo cargar la configuración de aportes: {meta.error}
      </div>
    );
  }

  if (allContributions.error) {
    return (
      <div className="rounded-[var(--radius-alert)] border border-danger-300 bg-danger-100 p-4 text-sm font-bold text-danger-900 animate-in fade-in dark:border-danger-800 dark:bg-danger-900 dark:text-danger-50">
        No se pudo cargar el detalle mensual: {allContributions.error}
      </div>
    );
  }

  if (!meta.data) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-6">
      <header className="-mt-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-start lg:gap-8 w-full md:w-auto">
            <div className="flex items-center justify-between gap-3 w-full lg:w-auto">
              <h2 className="text-2xl md:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 line-clamp-1">Aportes</h2>
              <div className="flex items-center gap-1.5">
                <YearSelect
                  activeYear={activeYear}
                  currentBusinessYear={currentBusinessYear}
                  minYear={meta.data.minYear}
                  setActiveYear={setActiveYear}
                  compact
                />
                <ScreenHelpButton
                  title="Aportes"
                  description={
                    <div className="space-y-4">
                      <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Selecciona un contribuyente, despliega su panel y toca un mes para registrar o corregir el aporte de forma individual.
                      </p>
                      
                      <div className="space-y-2.5 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                          Significado de colores
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-success-300 bg-success-100/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                            Meta alcanzada
                          </span>
                          <span className="inline-flex items-center rounded-full border border-primary-300 bg-primary-100/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400">
                            Colaborando
                          </span>
                          <span className="inline-flex items-center rounded-full border border-success-400 bg-success-200/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-900 ring-1 ring-success-200/50 dark:border-success-500/40 dark:bg-success-500/20 dark:text-success-300">
                            Colaborador destacado
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="flex w-full sm:w-auto">
              <Input
                type="text"
                placeholder="Buscar contribuyente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[20px] border-primary-100/70 bg-white/82 py-2 text-[15px] shadow-none placeholder:text-neutral-500/75 dark:border-neutral-700 dark:bg-neutral-800/88 dark:placeholder:text-neutral-500 sm:w-64 sm:rounded-xl sm:py-2.5 sm:text-sm sm:shadow-sm"
              />
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            {canEditContributions && (
              <Button onClick={openGlobalModal} disabled={!canMutateCurrentPeriod}>
                Nuevo Aporte
              </Button>
            )}
          </div>
        </div>
      </header>

      {contributionRestrictionMessage && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-100 px-3 py-2 text-xs font-bold text-primary-900 shadow-sm dark:border-primary-700 dark:bg-primary-900 dark:text-primary-50">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary-500"></span>
            {contributionRestrictionMessage}
          </div>
        </div>
      )}

      {visibleContributors.length === 0 ? (
        <Card className="border-primary-200 bg-[var(--gradient-surface)] dark:border-primary-900">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {searchQuery.trim()
              ? `No se encontraron contribuyentes para "${searchQuery.trim()}".`
              : "No hay contribuyentes para mostrar en este año."}
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {visibleContributors.map((contributor) => {
              const isExpanded = expandedContributorId === contributor.contributorId;

              return (
                <Card
                  key={contributor.contributorId}
                  className="overflow-hidden border-primary-100 bg-white shadow-sm transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-neutral-700 dark:bg-neutral-800"
                  bodyClassName="p-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedContributorId((previous) =>
                        previous === contributor.contributorId ? null : contributor.contributorId
                      )
                    }
                    className="flex min-h-[32px] w-full items-center justify-between gap-3 px-4 py-1.5 text-left"
                    aria-expanded={isExpanded}
                    aria-controls={`contributor-month-grid-${contributor.contributorId}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-neutral-900 dark:text-neutral-100">{contributor.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3.5">
                      <div className="text-right">
                        <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                          Total anual
                        </p>
                        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                          {formatCentsAsCurrency(contributor.totalPaidCents)}
                        </p>
                      </div>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary-100 bg-primary-50/60 text-neutral-500 transition-all dark:border-neutral-700 dark:bg-neutral-700/80 dark:text-neutral-300 ${
                          isExpanded ? "border-primary-200 bg-primary-100/70 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300" : ""
                        }`}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div
                      id={`contributor-month-grid-${contributor.contributorId}`}
                      className="border-t border-primary-50 px-4 pb-4 pt-3.5 dark:border-neutral-700"
                    >
                      <div className="grid grid-cols-3 gap-2.5">
                        {monthList.map((month) => {
                          const contribution = contributionMap.get(byContributionCellKey(contributor.contributorId, month)) ?? null;
                          const amountCents = contribution?.amountCents ?? 0;
                          const state = getContributionCellState(amountCents, monthlyAmountCents);
                          const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                          const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;
                          const isInteractive = canMutateCurrentPeriod && contributor.status === 1;
                          const baseCellStyle = isFutureMonth
                            ? getFutureCellStyle()
                            : !isInteractive
                              ? getMutedCellStyle(state)
                              : getCellStyle(state);

                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => openModalForCell(contributor, month)}
                              className={`flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] border px-1 py-1.5 shadow-sm transition-all ${baseCellStyle} ${
                                isCurrentMonth ? "border-primary-400 ring-2 ring-primary-100/50 dark:border-primary-500 dark:ring-primary-900/40" : ""
                              } ${
                                isInteractive ? "cursor-pointer hover:border-primary-300 hover:ring-2 hover:ring-primary-100 dark:hover:border-primary-700 dark:hover:ring-primary-900/50" : "cursor-not-allowed"
                              }`}
                              disabled={!isInteractive}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-current opacity-80">{getMonthLabel(month)}</span>
                                {isCurrentMonth && <span className="h-1.5 w-1.5 rounded-full bg-primary-500"></span>}
                              </div>
                              <div className={`text-[14px] font-black leading-tight ${amountCents === 0 ? "opacity-85" : ""}`}>
                                {amountCents > 0 ? formatCentsAsCurrency(amountCents) : "-"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>

          <Card
            className="hidden md:block overflow-hidden border-primary-200 bg-[var(--gradient-surface)] dark:border-primary-900"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[rgba(66,90,111,0.28)]">
              <div className="flex items-center justify-between border-b border-border bg-[var(--gradient-table-bar)] px-5 py-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded border border-success-300 bg-success-200/90 dark:border-success-400 dark:bg-success-400 dark:shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                      Alcanzada
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded border border-primary-300 bg-primary-200/90 dark:border-primary-400 dark:bg-primary-400 dark:shadow-[0_0_8px_rgba(37,99,235,0.4)]"></span>
                      Colaborando
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded border border-success-400 bg-success-400 dark:border-success-400 dark:bg-success-400/90 dark:shadow-[0_0_8px_rgba(34,197,94,0.3)]"></span>
                      Colaborador destacado
                    </div>
                  </div>
                </div>
              </div>

              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="bg-primary-50/50 dark:bg-primary-900/10">
                    <th className="sticky left-0 z-20 border-b border-r border-border bg-white px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
                      Contribuyente
                    </th>
                    {monthList.map((month) => {
                      const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                      const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;

                      return (
                        <th
                          key={month}
                          className={`border-b border-border px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                            isCurrentMonth
                              ? "bg-primary-100/70 text-primary-800 shadow-[inset_0_2px_0_0_#2563eb] dark:bg-primary-900/40 dark:text-primary-300 dark:shadow-[inset_0_2px_0_0_#3b82f6]"
                              : "text-neutral-600 dark:text-neutral-400"
                          } ${isFutureMonth ? "bg-primary-50/40 text-neutral-500 dark:bg-neutral-950/40 dark:text-neutral-500" : ""}`}
                        >
                          <span>{getMonthLabel(month).charAt(0).toUpperCase() + getMonthLabel(month).slice(1)}</span>
                        </th>
                      );
                    })}
                     <th className="border-b border-border bg-primary-50/80 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-700 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {visibleContributors.map((contributor) => (
                    <tr key={contributor.contributorId} className="group transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-900/15">
                      <td className="sticky left-0 z-10 border-r border-border bg-white px-5 py-3 shadow-sm transition-colors group-hover:bg-primary-50/10 dark:bg-neutral-900 dark:group-hover:bg-neutral-800/60">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-bold text-neutral-900 dark:text-neutral-100">{contributor.name}</div>
                          </div>
                        </div>
                      </td>

                      {monthList.map((month) => {
                        const contribution = contributionMap.get(byContributionCellKey(contributor.contributorId, month)) ?? null;
                        const amountCents = contribution?.amountCents ?? 0;
                        const state = getContributionCellState(amountCents, monthlyAmountCents);
                        const isCurrentMonth = isCurrentBusinessYear && month === currentBusinessMonth;
                        const isFutureMonth = isCurrentBusinessYear && month > currentBusinessMonth;
                        const isInteractive = canMutateCurrentPeriod && contributor.status === 1 && canEditContributions;
                        const baseCellStyle =
                          isFutureMonth || !isInteractive ? getMutedCellStyle(state) : getCellStyle(state);

                        return (
                          <td
                            key={month}
                            className={`px-1.5 py-2.5 ${isCurrentMonth ? "bg-primary-50/40 dark:bg-primary-900/10" : ""} ${isFutureMonth ? "bg-primary-50/30 dark:bg-transparent" : ""}`}

                          >
                            <button
                              type="button"
                              onClick={() => openModalForCell(contributor, month)}
                              className={`w-full min-h-[44px] rounded-xl border px-2 py-2 text-[12px] font-extrabold shadow-sm transition-all ${baseCellStyle} ${
                                isCurrentMonth ? "border-primary-300 ring-2 ring-primary-100 dark:border-primary-700 dark:ring-primary-900/40" : ""
                              } ${
                                isInteractive
                                  ? "cursor-pointer hover:border-primary-300 hover:ring-2 hover:ring-primary-100 dark:hover:border-primary-700 dark:hover:ring-primary-900/50"
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
                      <td className="bg-primary-50/20 px-4 py-3 text-right font-extrabold text-neutral-900 group-hover:bg-primary-50/40 dark:bg-primary-900/20 dark:text-neutral-100 dark:group-hover:bg-primary-900/30">
                        {formatCentsAsCurrency(contributor.totalPaidCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {selectedCell || isGlobalModalOpen ? (
        <Suspense fallback={null}>
          <ContributionModal
            open={Boolean(selectedCell) || isGlobalModalOpen}
            contributors={modalContributors}
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
            onClose={closeContributionModal}
            onSubmit={handleSave}
            onDelete={
              selectedCell?.existingContribution
                ? requestDeleteSelectedContribution
                : undefined
            }
          />
        </Suspense>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Eliminar aporte"
        description={
          pendingDelete
            ? (
              <span>
                ¿Estás seguro que deseas eliminar el aporte de{" "}
                <strong>{pendingDelete.contributorName}</strong>{" "}
                correspondiente a {getMonthLabel(pendingDelete.contribution.month)}/{pendingDelete.contribution.year}? Esta acción borrará el registro de la base de datos de este mes.
              </span>
            )
            : ""
        }
        confirmLabel="Eliminar"
        danger
        compact
        loading={deleting}
        onCancel={cancelDelete}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      {canEditContributions && (
        <Button
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.24)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] md:hidden flex items-center justify-center p-0"
          onClick={openGlobalModal}
          disabled={!canMutateCurrentPeriod}
          aria-label="Nuevo Aporte"
        >
          <span className="text-3xl leading-none -mt-1">+</span>
        </Button>
      )}

 
    </div>
  );
};
