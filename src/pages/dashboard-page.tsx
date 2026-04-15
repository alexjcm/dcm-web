import { useMemo } from "react";
import { 
  TrendingUp, 
  Target, 
  Scale, 
  Users,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";

import { SectionLoader } from "../components/ui/loaders";
import { ContributionStateBadge, ContributorStatusBadge } from "../components/ui/state-badge";
import { useAppContext } from "../context/app-context";
import { formatCentsAsCurrency } from "../lib/money";
import { useSummary } from "../hooks/use-summary";
import { Card } from "../components/ui/card";

export const DashboardPage = () => {
  const { activeYear } = useAppContext();
  const summary = useSummary(activeYear);

  const contributors = useMemo(() => {
    return [...(summary.data?.contributors ?? [])].sort((left, right) => left.name.localeCompare(right.name, "es"));
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          Resumen Ejecutivo
          <ChevronRight size={12} />
          {summary.data.year}
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard de Aportes</h2>
        <p className="mt-1 text-sm text-slate-500">Estado general, flujo de caja y seguimiento de contribuidores.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={48} className="text-primary-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recaudado</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-slate-900">{formatCentsAsCurrency(totals.collectedCents)}</p>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight size={14} />
              Actual
            </span>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Target size={48} className="text-indigo-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Esperado</p>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">{formatCentsAsCurrency(totals.expectedCents)}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1 italic">Meta anual del período</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Scale size={48} className="text-amber-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Diferencia</p>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">{formatCentsAsCurrency(totals.differenceCents)}</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1 italic">Balance de aportes</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Users size={48} className="text-slate-600" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Contribuidores</p>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900">{totals.contributorsCount}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">
              <span className="text-primary-600">{totals.activeContributorsCount} activos</span> · {totals.inactiveContributorsCount} inactivos
            </p>
          </div>
        </Card>
      </div>

      <Card header="Avance Detallado por Contribuidor" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Contribuidor</th>
                <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Estado</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Pagado</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Esperado</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Balance</th>
                <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Progreso Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contributors.map((item) => (
                <tr key={item.contributorId} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-primary-700 group-hover:bg-primary-100 group-hover:text-primary-800 transition-colors">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          {item.name}
                          <ContributorStatusBadge status={item.status} />
                        </div>
                        {item.email && <p className="text-xs text-slate-400">{item.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ContributionStateBadge state={item.state} />
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-900">{formatCentsAsCurrency(item.totalPaidCents)}</td>
                  <td className="px-6 py-4 text-right text-slate-500">{formatCentsAsCurrency(item.expectedCents)}</td>
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

