import { useMemo } from "react";

import { SectionLoader } from "../components/ui/loaders";
import { ContributionStateBadge, ContributorStatusBadge } from "../components/ui/state-badge";
import { useAppContext } from "../context/app-context";
import { formatCentsAsCurrency } from "../lib/money";
import { useSummary } from "../hooks/use-summary";

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
      <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">
        No se pudo cargar el dashboard: {summary.error}
      </div>
    );
  }

  if (!summary.data) {
    return null;
  }

  const { totals } = summary.data;

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard anual {summary.data.year}</h2>
        <p className="text-sm text-slate-600">Estado general, totales y avance por contribuidor.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Recaudado</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCentsAsCurrency(totals.collectedCents)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Esperado</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCentsAsCurrency(totals.expectedCents)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Diferencia</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCentsAsCurrency(totals.differenceCents)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Contribuidores</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totals.contributorsCount}</p>
          <p className="mt-1 text-xs text-slate-600">
            {totals.activeContributorsCount} activos · {totals.inactiveContributorsCount} inactivos
          </p>
        </article>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Contribuidor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Pagado</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Esperado</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Diferencia</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Meses completos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contributors.map((item) => (
                <tr key={item.contributorId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <ContributorStatusBadge status={item.status} />
                    </div>
                    {item.email ? <p className="text-xs text-slate-500">{item.email}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <ContributionStateBadge state={item.state} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCentsAsCurrency(item.totalPaidCents)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCentsAsCurrency(item.expectedCents)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCentsAsCurrency(item.differenceCents)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.monthsComplete}/12</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};
