import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Edit2, Plus, ReceiptText, Trash2, X } from "lucide-react";

import { ContributionModal, type ContributionPayload } from "../components/contributions/contribution-modal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { Select } from "../components/ui/fields";
import { SectionLoader } from "../components/ui/loaders";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributionsYearsAll } from "../hooks/use-contributions-years-all";
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

type ContributionsYearGroup = {
  year: number;
  months: ContributionsMonthGroup[];
};

const MIN_YEAR_WITH_DATA = 2023;

const formatPeriodLabel = (month: number, year: number): string =>
  `${getMonthLabel(month).replace(/^./, (value) => value.toUpperCase())}/${year}`;

export const ContributionsPage = () => {
  const { activeYear, canMutateCurrentPeriod, contributionRestrictionMessage } = useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();
  const currentBusinessMonth = getCurrentBusinessMonth();

  const contributors = useContributors("all");
  const settings = useSettings();

  const [contributorIdFilter, setContributorIdFilter] = useState<number | null>(null);
  const [loadedYears, setLoadedYears] = useState<number[]>([activeYear]);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  const [editState, setEditState] = useState<EditState>({ contribution: null, open: false });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const contributions = useContributionsYearsAll(loadedYears);

  useEffect(() => {
    setLoadedYears([activeYear]);
    setOpenMonths({});
  }, [activeYear]);

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

  const yearGroups = useMemo<ContributionsYearGroup[]>(() => {
    const itemsByYear = contributions.data?.itemsByYear ?? {};

    return [...loadedYears]
      .sort((left, right) => right - left)
      .map((year) => {
        const yearItems = itemsByYear[year] ?? [];
        const filteredYearItems =
          contributorIdFilter === null
            ? yearItems
            : yearItems.filter((item) => item.contributorId === contributorIdFilter);

        const months = new Map<string, ContributionsMonthGroup>();

        for (const item of filteredYearItems) {
          const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
          const existing = months.get(key);

          if (existing) {
            existing.items.push(item);
            continue;
          }

          months.set(key, {
            key,
            label: formatPeriodLabel(item.month, item.year),
            month: item.month,
            year: item.year,
            items: [item]
          });
        }

        if (year === activeYear && !months.has(`${year}-${String(currentBusinessMonth).padStart(2, "0")}`)) {
          months.set(`${year}-${String(currentBusinessMonth).padStart(2, "0")}`, {
            key: `${year}-${String(currentBusinessMonth).padStart(2, "0")}`,
            label: formatPeriodLabel(currentBusinessMonth, year),
            month: currentBusinessMonth,
            year,
            items: []
          });
        }

        const sortedMonths = Array.from(months.values()).sort((left, right) => {
          if (year === activeYear) {
            const leftIsCurrent = left.month === currentBusinessMonth;
            const rightIsCurrent = right.month === currentBusinessMonth;

            if (leftIsCurrent && !rightIsCurrent) {
              return -1;
            }

            if (!leftIsCurrent && rightIsCurrent) {
              return 1;
            }
          }

          return right.month - left.month;
        });

        return {
          year,
          months: sortedMonths
        };
      })
      .filter((group) => group.months.length > 0);
  }, [activeYear, contributions.data, contributorIdFilter, currentBusinessMonth, loadedYears]);

  const hasActiveFilters = contributorIdFilter !== null;
  const oldestLoadedYear = Math.min(...loadedYears);
  const canLoadPreviousYear = oldestLoadedYear > MIN_YEAR_WITH_DATA;

  const isMonthOpen = (group: ContributionsMonthGroup) => {
    const explicitState = openMonths[group.key];

    if (explicitState !== undefined) {
      return explicitState;
    }

    const isCurrentMonthOfActiveYear = group.year === activeYear && group.month === currentBusinessMonth;

    if (isCurrentMonthOfActiveYear) {
      return true;
    }

    return false;
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
      toast.info("Contribuyente inactivo: este aporte no es editable.");
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

  const handleLoadPreviousYear = () => {
    if (!canLoadPreviousYear) {
      return;
    }

    const previousYear = oldestLoadedYear - 1;

    setLoadedYears((current) => {
      if (current.includes(previousYear)) {
        return current;
      }

      return [...current, previousYear];
    });
  };

  const totalVisibleItems = yearGroups.reduce((total, yearGroup) => {
    return total + yearGroup.months.reduce((monthsTotal, monthGroup) => monthsTotal + monthGroup.items.length, 0);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-inner">
            <ReceiptText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Registro de Aportes</h2>
            <p className="mt-1 text-sm text-slate-500">Gestión detallada por mes para crear, corregir y eliminar aportes del período.</p>
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

      <Card bodyClassName="p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(240px,320px)_auto] sm:items-end sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-[minmax(220px,320px)_auto] sm:items-end">
            <Select
              label="Contribuyente"
              value={contributorIdFilter ?? ""}
              onChange={(event) => setContributorIdFilter(event.target.value ? Number(event.target.value) : null)}
              className="h-10"
            >
              <option value="">Todos los contribuyentes</option>
              {contributorOptions.map((contributor) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.name}
                </option>
              ))}
            </Select>

            <div className="flex gap-2 sm:pb-0.5">
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={() => setContributorIdFilter(null)}
                  aria-label="Limpiar filtro"
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:justify-self-end">
            <span className="font-semibold text-slate-900">Mes actual:</span> {formatPeriodLabel(currentBusinessMonth, activeYear)}
          </div>
        </div>
      </Card>

      {contributions.loading && !contributions.data ? <SectionLoader label="Cargando registro de aportes..." /> : null}
      {contributions.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 animate-in fade-in">
          No se pudo cargar el listado: {contributions.error}
        </div>
      ) : null}

      {contributions.data && totalVisibleItems === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-base font-bold text-slate-900">
              {hasActiveFilters ? "No hay aportes para el filtro aplicado." : "No hay aportes registrados para este año."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveFilters
                ? "Prueba con otro contribuyente o limpia el filtro."
                : canLoadPreviousYear
                  ? "Puedes cargar años anteriores o registrar un aporte para comenzar a poblar el historial."
                  : "Registra un aporte para comenzar a poblar el historial."}
            </p>
          </div>
        </Card>
      ) : null}

      {yearGroups.map((yearGroup) => (
        <section key={yearGroup.year} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Aportes {yearGroup.year}</h3>
            </div>
          </div>

          {yearGroup.months.map((group) => {
            const expanded = isMonthOpen(group);
            const isCurrentMonth = group.year === activeYear && group.month === currentBusinessMonth;

            return (
              <Card key={group.key} bodyClassName="p-0">
                <button
                  type="button"
                  onClick={() => toggleMonth(group.key, !expanded)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <p className="text-base font-extrabold text-slate-900">{group.label}</p>
                    {isCurrentMonth ? (
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-700">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <span className="flex items-center text-slate-500">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-slate-100">
                    {group.items.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-slate-500">
                        No hay aportes registrados en {group.label}.
                      </div>
                    ) : null}
                    <div className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const contributor = contributorById.get(item.contributorId);

                        return (
                          <article
                            key={item.id}
                            className="grid gap-2 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                                  {item.contributorName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-slate-900">{item.contributorName}</p>
                                </div>
                              </div>
                            </div>

                            <div className="text-sm font-extrabold text-slate-900 sm:min-w-[110px] sm:text-right">
                              {formatCentsAsCurrency(item.amountCents)}
                            </div>

                            <div className="flex gap-2 sm:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={Edit2}
                                onClick={() => openEditModal(item)}
                                disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                                aria-label={`Editar aporte de ${item.contributorName}`}
                                className="px-2.5"
                              />
                              <Button
                                size="sm"
                                variant="danger"
                                icon={Trash2}
                                onClick={() => setPendingDelete(item)}
                                disabled={!canMutateCurrentPeriod || contributor?.status === 0}
                                aria-label={`Eliminar aporte de ${item.contributorName}`}
                                className="px-2.5"
                              />
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
        </section>
      ))}

      {contributions.data ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadPreviousYear}
            disabled={!canLoadPreviousYear || contributions.loading}
          >
            {canLoadPreviousYear ? `Cargar ${oldestLoadedYear - 1}` : "Sin más años"}
          </Button>
        </div>
      ) : null}

      <ContributionModal
        open={editState.open}
        contributors={activeContributorOptions}
        monthlyAmountCents={settings.monthlyAmountCents}
        defaultYear={activeYear}
        defaultMonth={currentBusinessMonth}
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
