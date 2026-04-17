import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit2, Filter, Plus, ReceiptText, Trash2, X } from "lucide-react";

import { ContributionModal, type ContributionPayload } from "../components/contributions/contribution-modal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { Select } from "../components/ui/fields";
import { SectionLoader } from "../components/ui/loaders";
import { ContributorStatusBadge } from "../components/ui/state-badge";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributionsYearAll } from "../hooks/use-contributions-year-all";
import { useContributors } from "../hooks/use-contributors";
import { useInvalidateResources } from "../hooks/use-resource-invalidation";
import { useSettings } from "../hooks/use-settings";
import { getCurrentBusinessMonth } from "../lib/business-time";
import { getMonthLabel } from "../lib/date";
import { formatCentsAsCurrency } from "../lib/money";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contribution, Contributor } from "../types/domain";

type EditState = {
  contribution: Contribution | null;
  open: boolean;
};

type ContributionsMonthGroup = {
  key: string;
  label: string;
  month: number;
  year: number;
  items: Contribution[];
};

const formatPeriodLabel = (month: number, year: number): string =>
  `${getMonthLabel(month).replace(/^./, (value) => value.toUpperCase())}/${year}`;

export const ContributionsPage = () => {
  const { activeYear, canMutateCurrentPeriod, contributionRestrictionMessage } = useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const contributors = useContributors("all");
  const settings = useSettings();
  const contributions = useContributionsYearAll(activeYear);

  const [contributorIdFilter, setContributorIdFilter] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  const [editState, setEditState] = useState<EditState>({ contribution: null, open: false });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

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

  const filteredItems = useMemo(() => {
    const items = contributions.data?.items ?? [];

    if (contributorIdFilter === null) {
      return items;
    }

    return items.filter((item) => item.contributorId === contributorIdFilter);
  }, [contributions.data, contributorIdFilter]);

  const monthGroups = useMemo<ContributionsMonthGroup[]>(() => {
    const groups = new Map<string, ContributionsMonthGroup>();

    for (const item of filteredItems) {
      const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(item);
        continue;
      }

      groups.set(key, {
        key,
        label: formatPeriodLabel(item.month, item.year),
        month: item.month,
        year: item.year,
        items: [item]
      });
    }

    return Array.from(groups.values()).sort((left, right) => {
      if (left.year !== right.year) {
        return right.year - left.year;
      }

      return right.month - left.month;
    });
  }, [filteredItems]);

  const hasActiveFilters = contributorIdFilter !== null;

  const isMonthOpen = (group: ContributionsMonthGroup, index: number) => {
    const explicitState = openMonths[group.key];

    if (explicitState !== undefined) {
      return explicitState;
    }

    if (index === 0) {
      return true;
    }

    return group.month === getCurrentBusinessMonth() && group.year === activeYear;
  };

  const toggleMonth = (key: string, nextValue: boolean) => {
    setOpenMonths((previous) => ({
      ...previous,
      [key]: nextValue
    }));
  };

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

    toast.success("Aporte eliminado.");
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
          </div>
        </div>

        <Button
          icon={Plus}
          onClick={openCreateModal}
          disabled={!canMutateCurrentPeriod}
          className="w-full shadow-md shadow-primary-200 sm:w-auto"
        >
          Nuevo Aporte
        </Button>
      </header>

      <Card className="p-4" bodyClassName="p-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Filtros</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={() => setContributorIdFilter(null)}
                  className="justify-center"
                >
                  Limpiar filtros
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                icon={Filter}
                onClick={() => setFiltersOpen((previous) => !previous)}
                className="justify-center sm:min-w-[140px]"
              >
                {filtersOpen ? "Ocultar filtros" : "Más filtros"}
              </Button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Año activo:</span> {activeYear}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {contributions.loading && !contributions.data ? <SectionLoader label="Cargando aportes..." /> : null}
      {contributions.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in">
          No se pudo cargar el listado: {contributions.error}
        </div>
      ) : null}

      {contributions.data && monthGroups.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-base font-bold text-slate-900">
              {hasActiveFilters ? "No hay aportes para el filtro aplicado." : "No hay aportes registrados para este año."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveFilters ? "Prueba con otro contribuidor o limpia el filtro." : "Registra un aporte para comenzar a poblar el historial."}
            </p>
          </div>
        </Card>
      ) : null}

      {monthGroups.map((group, index) => {
        const expanded = isMonthOpen(group, index);

        return (
          <Card key={group.key} bodyClassName="p-0">
            <button
              type="button"
              onClick={() => toggleMonth(group.key, !expanded)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Período</p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">{group.label}</h3>
              </div>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                {expanded ? "Ocultar" : "Ver aportes"}
              </span>
            </button>

            {expanded ? (
              <div className="border-t border-slate-100 p-4 sm:p-5">
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const contributor = contributorById.get(item.contributorId);

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                                {item.contributorName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-base font-bold text-slate-900">{item.contributorName}</p>
                                  {contributor ? <ContributorStatusBadge status={contributor.status} /> : null}
                                </div>
                                <p className="mt-2 text-lg font-extrabold text-slate-900">{formatCentsAsCurrency(item.amountCents)}</p>
                                {item.notes ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.notes}</p> : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 md:shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit2}
                              onClick={() => openEditModal(item)}
                              disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                              className="flex-1 md:flex-none"
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={Trash2}
                              onClick={() => setPendingDelete(item)}
                              disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                              className="flex-1 md:flex-none"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}

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
        title="Eliminar aporte"
        description={
          pendingDelete
            ? `El aporte de ${pendingDelete.contributorName} en ${formatPeriodLabel(pendingDelete.month, pendingDelete.year)} dejará de mostrarse en el listado activo. Esta acción no borra el historial interno.`
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
    </div>
  );
};
