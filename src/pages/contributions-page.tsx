import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ContributionModal, type ContributionPayload } from "../components/contributions/contribution-modal";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { SectionLoader } from "../components/ui/loaders";
import { ContributorStatusBadge } from "../components/ui/state-badge";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributions } from "../hooks/use-contributions";
import { useContributors } from "../hooks/use-contributors";
import { useInvalidateResources } from "../hooks/use-resource-invalidation";
import { useSettings } from "../hooks/use-settings";
import { getCurrentBusinessMonth } from "../lib/business-time";
import { formatCentsAsCurrency } from "../lib/money";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contribution, Contributor } from "../types/domain";

const PAGE_SIZE = 10;

type EditState = {
  contribution: Contribution | null;
  open: boolean;
};

export const ContributionsPage = () => {
  const { activeYear, canMutateCurrentPeriod, contributionRestrictionMessage } = useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const contributors = useContributors("all");
  const settings = useSettings();

  const [contributorIdFilter, setContributorIdFilter] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [editState, setEditState] = useState<EditState>({ contribution: null, open: false });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const contributions = useContributions({
    year: activeYear,
    contributorId: contributorIdFilter,
    pageNumber,
    pageSize: PAGE_SIZE
  });

  useEffect(() => {
    setPageNumber(1);
  }, [activeYear, contributorIdFilter]);

  const contributorById = useMemo(() => {
    const map = new Map<number, Contributor>();

    for (const contributor of contributors.data?.items ?? []) {
      map.set(contributor.id, contributor);
    }

    return map;
  }, [contributors.data]);

  const contributorOptions = useMemo(() => {
    return (contributors.data?.items ?? []).slice().sort((left, right) => left.name.localeCompare(right.name, "es"));
  }, [contributors.data]);

  const activeContributorOptions = useMemo(() => {
    return contributorOptions.filter((contributor) => contributor.status === 1);
  }, [contributorOptions]);

  const openCreateModal = () => {
    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No puedes editar este período.");
      return;
    }

    setEditState({ contribution: null, open: true });
  };

  const openEditModal = (contribution: Contribution) => {
    const contributorStatus = contributorById.get(contribution.contributorId)?.status;

    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No puedes editar este período.");
      return;
    }

    if (contributorStatus === 0) {
      toast.info("Contribuidor inactivo: este aporte no es editable.");
      return;
    }

    setEditState({ contribution, open: true });
  };

  const handleSave = async (payload: ContributionPayload) => {
    setSubmitting(true);

    const response = editState.contribution
      ? await api.put<Contribution>(`/api/contributions/${editState.contribution.id}`, payload)
      : await api.post<Contribution>("/api/contributions", payload);

    setSubmitting(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success(editState.contribution ? "Aporte actualizado." : "Aporte registrado.");
    setEditState({ contribution: null, open: false });
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

    toast.success("Aporte desactivado.");
    setPendingDelete(null);
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Listado de aportes</h2>
          <p className="text-sm text-slate-600">Filtro por año y contribuidor con paginación de 10 registros por página.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
          disabled={!canMutateCurrentPeriod}
        >
          Nuevo aporte
        </button>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Contribuidor</span>
          <select
            value={contributorIdFilter ?? ""}
            onChange={(event) => setContributorIdFilter(event.target.value ? Number(event.target.value) : null)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Todos</option>
            {contributorOptions.map((contributor) => (
              <option key={contributor.id} value={contributor.id}>
                {contributor.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {contributions.loading && !contributions.data ? <SectionLoader label="Cargando aportes..." /> : null}
      {contributions.error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          No se pudo cargar el listado: {contributions.error}
        </div>
      ) : null}

      {contributions.data ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Contribuidor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Período</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Monto</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Pago</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contributions.data.items.map((item) => {
                  const contributor = contributorById.get(item.contributorId);

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{item.contributorName}</span>
                          {contributor ? <ContributorStatusBadge status={contributor.status} /> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.month}/{item.year}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCentsAsCurrency(item.amountCents)}</td>
                      <td className="px-4 py-3 text-slate-700">{item.paidAt ?? "Sin fecha"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => openEditModal(item)}
                            disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            onClick={() => setPendingDelete(item)}
                            disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
            <p>
              Página {contributions.data.pagination.number} de {Math.max(1, contributions.data.pagination.totalPages || 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setPageNumber((previous) => Math.max(1, previous - 1))}
                disabled={!contributions.data.pagination.hasPrevPage}
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setPageNumber((previous) => previous + 1)}
                disabled={!contributions.data.pagination.hasNextPage}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ContributionModal
        open={editState.open}
        contributors={activeContributorOptions}
        monthlyAmountCents={settings.monthlyAmountCents}
        defaultYear={activeYear}
        defaultMonth={getCurrentBusinessMonth()}
        initialContribution={editState.contribution}
        lockedReason={canMutateCurrentPeriod ? null : contributionRestrictionMessage}
        submitting={submitting}
        onClose={() => setEditState({ contribution: null, open: false })}
        onSubmit={handleSave}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Desactivar aporte"
        description={
          pendingDelete
            ? `Se desactivará el aporte de ${pendingDelete.contributorName} (${pendingDelete.month}/${pendingDelete.year}).`
            : ""
        }
        confirmLabel="Desactivar"
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </section>
  );
};
