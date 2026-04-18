import { useMemo } from "react";
import { TrendingUp, Scale, ChevronRight } from "lucide-react";

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

export const DashboardPage = () => {
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
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in slide-in-from-top-1">
        No se pudo cargar el dashboard: {summary.error}
      </div>
    );
  }

  if (!summary.data) {
    return null;
  }

  const { totals } = summary.data;
  const pendingCount = contributors.filter((item) => item.state === "pending").length;
  const incompleteCount = contributors.filter((item) => item.state === "incomplete").length;
  const completeCount = contributors.filter((item) => item.state === "complete").length;
  const overpaidCount = contributors.filter((item) => item.state === "overpaid").length;
  const operationalStats = [
    {
      label: "Pendientes",
      value: pendingCount,
      className: "bg-slate-100 text-slate-600"
    },
    {
      label: "Incompletos",
      value: incompleteCount,
      className: "bg-amber-50 text-amber-700"
    },
    {
      label: "Completos",
      value: completeCount,
      className: "bg-emerald-50 text-emerald-700"
    },
    {
      label: "Excedentes",
      value: overpaidCount,
      className: "bg-indigo-50 text-indigo-700"
    }
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard de Aportes</h2>
            <p className="mt-1 text-sm text-slate-500">Resumen anual y prioridades operativas.</p>
          </div>
          <YearSelect
            activeYear={activeYear}
            currentBusinessYear={currentBusinessYear}
            setActiveYear={setActiveYear}
            compact
          />
        </div>
      </header>

      <Card className="relative overflow-hidden" bodyClassName="p-4 sm:p-6">
        <div className="absolute right-4 top-4 hidden opacity-10 sm:block">
          <div className="flex items-center gap-3 text-slate-400">
            <TrendingUp size={38} className="text-primary-600" />
            <Scale size={38} className="text-amber-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendiente por cubrir</p>
            <p className="mt-1.5 text-xl font-extrabold text-slate-900 sm:text-3xl">{formatCentsAsCurrency(Math.abs(totals.differenceCents))}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-600">Meta anual: {formatCentsAsCurrency(totals.expectedCents)}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recaudado</p>
            <p className="mt-1.5 text-xl font-extrabold text-slate-900 sm:text-2xl">{formatCentsAsCurrency(totals.collectedCents)}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">Acumulado del año</p>
          </div>
        </div>
      </Card>

      <Card header="Avance Operativo por Contribuyente" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-6 py-3">
          {operationalStats.map((item) => (
            <span key={item.label} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.className}`}>
              {item.label}: {item.value}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Contribuyente</th>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Estado</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Pagado</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Balance</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Progreso Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contributors.map((item) => (
                <tr key={item.contributorId} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {item.name}
                      </div>
                      <div>
                        {item.email && <p className="text-xs text-slate-400">{item.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ContributionStateBadge state={item.state} />
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900">{formatCentsAsCurrency(item.totalPaidCents)}</td>
                  <td className={`px-6 py-4 text-right font-semibold ${item.differenceCents < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCentsAsCurrency(item.differenceCents)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-xs font-bold text-slate-700">{item.monthsComplete}/12</span>
                       <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full" 
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
