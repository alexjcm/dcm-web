import { useMemo } from "react";
import { TrendingUp, Scale } from "lucide-react";

import { SectionLoader } from "../components/ui/loaders";
import { ContributionStateBadge } from "../components/ui/state-badge";
import { YearSelect } from "../components/ui/year-select";
import { useAppContext } from "../context/app-context";
import { formatCentsAsCurrency } from "../lib/money";
import { useSummary } from "../hooks/use-summary";
import { Card } from "../components/ui/card";
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
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">Resumen de Aportes</h2>
          </div>
          <YearSelect
            activeYear={activeYear}
            currentBusinessYear={currentBusinessYear}
            setActiveYear={setActiveYear}
            compact
          />
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
          <div className="rounded-[var(--radius-dialog)] border border-primary-100 bg-[var(--gradient-nav-header)] p-4 shadow-card sm:p-6 dark:border-primary-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-600">Total Recaudado</p>
            <p className="mt-2 text-3xl font-black leading-none text-primary-900 sm:mt-2 sm:text-5xl dark:text-primary-200">
              {formatCentsAsCurrency(totals.collectedCents)}
            </p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-neutral-600 sm:mt-4 sm:text-sm sm:leading-6 dark:text-neutral-400">
              Acumulado total de aportes efectivamente recibidos durante el año en curso.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-4">
              <div className="rounded-full border border-primary-300 bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-900 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                Meta proyectada: {formatCentsAsCurrency(totals.expectedCents)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card header="Avance Operativo por Contribuyente" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-primary-50/60 dark:bg-primary-900/20">
              <tr>
                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400">Contribuyente</th>
                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400">Estado</th>
                <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400">Pagado</th>
                <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-neutral-600 text-[11px] dark:text-neutral-400">Progreso Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contributors.map((item) => (
                <tr key={item.contributorId} className="group transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/20">
                  <td className="px-6 py-3.5">
                    <div>
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {item.name}
                      </div>
                    </div>

                  </td>
                  <td className="px-6 py-3.5">
                    <ContributionStateBadge state={item.state} />
                  </td>
                  <td className="px-6 py-3.5 text-right font-extrabold text-neutral-900 dark:text-neutral-100">{formatCentsAsCurrency(item.totalPaidCents)}</td>
                  <td className="px-6 py-3.5 text-right">
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
