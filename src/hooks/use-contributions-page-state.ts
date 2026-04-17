import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { ContributionPayload } from "../components/contributions/contribution-modal";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "./use-api-client";
import { useContributionsYearsAll } from "./use-contributions-years-all";
import { useContributors } from "./use-contributors";
import { useInvalidateResources } from "./use-resource-invalidation";
import { useSettings } from "./use-settings";
import { getCurrentBusinessMonth } from "../lib/business-time";
import { getMonthLabel } from "../lib/date";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contribution, Contributor } from "../types/domain";
import type { ContributionsMonthGroup, ContributionsYearGroup } from "../types/contributions-page";

type EditState = {
  contribution: Contribution | null;
  open: boolean;
};

const MIN_YEAR_WITH_DATA = 2023;

const formatPeriodLabel = (month: number, year: number): string =>
  `${getMonthLabel(month).replace(/^./, (value) => value.toUpperCase())}/${year}`;

export const useContributionsPageState = () => {
  const { activeYear, canMutateCurrentPeriod, contributionRestrictionMessage } = useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();
  const currentBusinessMonth = getCurrentBusinessMonth();

  const contributors = useContributors("all");
  const [contributorIdFilter, setContributorIdFilter] = useState<number | null>(null);
  const [loadedYears, setLoadedYears] = useState<number[]>([activeYear]);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [editState, setEditState] = useState<EditState>({ contribution: null, open: false });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const settings = useSettings(editState.open);

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
  const totalVisibleItems = yearGroups.reduce((total, yearGroup) => {
    return total + yearGroup.months.reduce((monthsTotal, monthGroup) => monthsTotal + monthGroup.items.length, 0);
  }, 0);

  const isMonthOpen = (group: ContributionsMonthGroup) => {
    const explicitState = openMonths[group.key];

    if (explicitState !== undefined) {
      return explicitState;
    }

    return group.year === activeYear && group.month === currentBusinessMonth;
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

  const closeEditModal = () => {
    setEditState({ contribution: null, open: false });
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
    closeEditModal();
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

  return {
    activeYear,
    canMutateCurrentPeriod,
    contributionRestrictionMessage,
    contributorById,
    contributorIdFilter,
    contributorOptions,
    activeContributorOptions,
    currentBusinessMonth,
    settings,
    contributions,
    yearGroups,
    hasActiveFilters,
    canLoadPreviousYear,
    oldestLoadedYear,
    totalVisibleItems,
    editState,
    submitting,
    pendingDelete,
    deleting,
    setContributorIdFilter,
    setPendingDelete,
    isMonthOpen,
    toggleMonth,
    openCreateModal,
    openEditModal,
    closeEditModal,
    handleSave,
    handleDelete,
    handleLoadPreviousYear,
    formatPeriodLabel
  };
};
