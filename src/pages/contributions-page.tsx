import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ReceiptText
} from "lucide-react";

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
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/fields";
import { Card } from "../components/ui/card";

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
            <ReceiptText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Listado de Aportes</h2>
            <p className="text-sm text-slate-500">Gestión histórica y registro de contribuciones del período.</p>
          </div>
        </div>

        <Button
          icon={Plus}
          onClick={openCreateModal}
          disabled={!canMutateCurrentPeriod}
          className="shadow-md shadow-primary-200 w-full sm:w-auto"
        >
          Nuevo Aporte
        </Button>
      </header>

      <Card className="p-4" bodyClassName="p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
           <div className="flex-1">
             <Select
                label="Filtrar por Contribuidor"
                value={contributorIdFilter ?? ""}
                onChange={(event) => setContributorIdFilter(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Todos los contribuidores</option>
                {contributorOptions.map((contributor) => (
                  <option key={contributor.id} value={contributor.id}>
                    {contributor.name}
                  </option>
                ))}
              </Select>
           </div>
           <Button variant="outline" icon={Filter} className="hidden sm:flex shrink-0">
              Más filtros
           </Button>
        </div>
      </Card>

      {contributions.loading && !contributions.data ? <SectionLoader label="Cargando aportes..." /> : null}
      {contributions.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in">
          No se pudo cargar el listado: {contributions.error}
        </div>
      ) : null}

      {contributions.data ? (
        <Card bodyClassName="p-0" footer={
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Página {contributions.data.pagination.number} de {Math.max(1, contributions.data.pagination.totalPages || 1)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setPageNumber((previous) => Math.max(1, previous - 1))}
                disabled={!contributions.data.pagination.hasPrevPage}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setPageNumber((previous) => previous + 1)}
                disabled={!contributions.data.pagination.hasNextPage}
              >
                Siguiente
              </Button>
            </div>
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Contribuidor</th>
                  <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Período</th>
                  <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Monto</th>
                  <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Fecha de Pago</th>
                  <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contributions.data.items.map((item) => {
                  const contributor = contributorById.get(item.contributorId);

                  return (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                            {item.contributorName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 leading-none">{item.contributorName}</span>
                            {contributor && (
                              <div className="mt-1">
                                <ContributorStatusBadge status={contributor.status} />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                          {item.month}/{item.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900">{formatCentsAsCurrency(item.amountCents)}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{item.paidAt ?? "Sin fecha registrada"}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            onClick={() => openEditModal(item)}
                            disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                            aria-label="Editar aporte"
                          />
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => setPendingDelete(item)}
                            disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                            aria-label="Eliminar aporte"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
    </div>
  );
};

