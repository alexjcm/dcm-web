import { useMemo } from "react";
import { TrendingUp, Scale } from "lucide-react";

import { SectionLoader } from "../components/ui/loaders";
import { ContributionStateBadge } from "../components/ui/state-badge";
import { YearSelect } from "../components/ui/year-select";
import { useAppContext } from "../context/app-context";
import { formatCentsAsCurrency } from "../lib/money";
import { useSummary } from "../hooks/use-summary";
import { Card } from "../components/ui/card";
import { ScreenHelpButton } from "../components/ui/screen-help-button";
import type { ContributionState } from "../types/domain";

const getStatePriority = (state: ContributionState): number => {
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

const mobileStateStyles: Record<ContributionState, string> = {
  pending: "border-neutral-300 bg-neutral-100/90 text-neutral-700 dark:border-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-400",
  incomplete: "border-primary-300 bg-primary-100/70 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400",
  complete: "border-success-300 bg-success-100/70 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400",
  overpaid: "border-success-400 bg-success-200/50 text-success-900 ring-1 ring-success-200/50 dark:border-success-500/40 dark:bg-success-500/20 dark:text-success-300"
};

const mobileStateLabels: Record<ContributionState, string> = {
  pending: "Sin aportes",
  incomplete: "Colaborando",
  complete: "Meta alcanzada",
  overpaid: "Colaborador destacado"
};

export const SummaryPage = () => {
  const { activeYear, currentBusinessYear, setActiveYear } = useAppContext();
  const summary = useSummary(activeYear);

  const contributors = useMemo(() => {
    return [...(summary.data?.contributors ?? [])].sort((left, right) => {
      const stateDiff = getStatePriority(left.state) - getStatePriority(right.state);

      if (stateDiff !== 0) {
        return stateDiff;
      }

      if (left.status !== right.status) {
        return right.status - left.status;
      }

      return left.name.localeCompare(right.name, "es");
    });
  }, [summary.data]);

  if (summary.loading && !summary.data) {
    return <SectionLoader label="Cargando resumen anual..." />;
  }

  if (summary.error) {
    return (
      <div className="rounded-[var(--radius-alert)] border border-danger-300 bg-danger-100 p-4 text-sm font-bold text-danger-900 animate-in fade-in slide-in-from-top-1 dark:border-danger-800 dark:bg-danger-900 dark:text-danger-50">
        No se pudo cargar el resumen: {summary.error}
      </div>
    );
  }

  if (!summary.data) {
    return null;
  }

  const { totals } = summary.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="-mt-2">
        <div className="flex items-start justify-between gap-2.5">
          <h2 className="min-w-0 flex-1 text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100">
            Resumen de Aportes
          </h2>
          <div className="flex shrink-0 items-center gap-1.5">
            <YearSelect
              activeYear={activeYear}
              currentBusinessYear={currentBusinessYear}
              minYear={summary.data.minYear}
              setActiveYear={setActiveYear}
              compact
            />
            <ScreenHelpButton
              title="Resumen"
              description="Revisa el total recaudado y el avance anual por contribuyente para el año seleccionado."
            />
          </div>
        </div>
      </header>

      <Card
        className="relative overflow-hidden border-primary-300 bg-[var(--gradient-surface)] dark:border-primary-900"
        bodyClassName="px-4 py-4 sm:px-6 sm:py-5"
      >
        <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_58%)] sm:block dark:bg-[radial-gradient(circle_at_top,rgba(30,58,138,0.15),transparent_58%)]" />
        <div className="absolute right-5 top-5 hidden opacity-80 sm:block">
          <div className="flex items-center gap-3 text-neutral-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] border border-white/50 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
              <TrendingUp size={24} className="text-primary-700 dark:text-primary-400" />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] border border-white/50 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
              <Scale size={24} className="text-primary-400 dark:text-primary-500" />
            </div>
          </div>
        </div>

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-600">Total Recaudado</p>
          <p className="mt-2 text-3xl font-black leading-none text-primary-900 sm:text-5xl dark:text-primary-200">
            {formatCentsAsCurrency(totals.collectedCents)}
          </p>
          <p className="mt-3 max-w-xl text-xs leading-5 text-neutral-600 sm:mt-4 sm:text-sm sm:leading-6 dark:text-neutral-400">
            Acumulado total de aportes efectivamente recibidos durante el año en curso.
          </p>
        </div>
      </Card>

      <Card bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/60 dark:bg-primary-900/20">
              <tr>
                <th className="pl-0 pr-2 py-3 text-left font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400 sm:pr-3">Contribuyente</th>
                <th className="hidden px-4 py-3 text-left font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400 md:table-cell md:px-6">Estado</th>
                <th className="px-2 py-3 text-right font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400 sm:px-4 md:px-6">Pagado</th>
                <th className="px-2 py-3 text-right font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400 sm:px-4 md:px-6">
                  <span className="inline-flex flex-col leading-tight text-right">
                    <span>Progreso</span>
                    <span>Anual</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contributors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    No hay contribuyentes para mostrar en este año.
                  </td>
                </tr>
              ) : (
                contributors.map((item) => (
                  <tr key={item.contributorId} className="group transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/20">
                    <td className="pl-0 pr-2 py-3.5 sm:pr-3">
                      <div>
                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {item.name}
                        </div>
                        <div className="mt-1 md:hidden">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${mobileStateStyles[item.state]}`}
                          >
                            {mobileStateLabels[item.state]}
                          </span>
                        </div>
                      </div>

                    </td>
                    <td className="hidden px-4 py-3.5 md:table-cell md:px-6">
                      <ContributionStateBadge state={item.state} />
                    </td>
                    <td className="px-2 py-3.5 text-right font-extrabold text-neutral-900 dark:text-neutral-100 sm:px-4 md:px-6">{formatCentsAsCurrency(item.totalPaidCents)}</td>
                    <td className="px-2 py-3.5 text-right sm:px-4 md:px-6">
                      <div className="flex items-center justify-end gap-2">
                         <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{Math.floor(item.monthsComplete)}/12</span>
                         <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 ring-1 ring-neutral-300/10 dark:ring-neutral-700/50">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.monthsComplete >= 12
                                  ? "bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                  : "bg-primary-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                              }`}
                              style={{ width: `${(item.monthsComplete / 12) * 100}%` }}
                            />
                         </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
