import { useMemo } from "react";

import { getContributionCellState } from "../components/ui/state-badge";
import type { Contribution, Contributor, ContributorMeta } from "../types/domain";

const getStatePriority = (state: ReturnType<typeof getContributionCellState>): number => {
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

export const byContributionCellKey = (contributorId: number, month: number): string => `${contributorId}:${month}`;

type UseContributionsPageDerivedParams = {
  contributions: Contribution[] | undefined;
  contributors: ContributorMeta[];
  currentBusinessMonth: number;
  monthlyAmountCents: number;
  searchQuery: string;
};

export const useContributionsPageDerived = ({
  contributions,
  contributors,
  currentBusinessMonth,
  monthlyAmountCents,
  searchQuery
}: UseContributionsPageDerivedParams) => {
  const contributionMap = useMemo(() => {
    const map = new Map<string, Contribution>();

    for (const item of contributions ?? []) {
      map.set(byContributionCellKey(item.contributorId, item.month), item);
    }

    return map;
  }, [contributions]);

  const sortedContributors = useMemo(() => {
    return [...contributors].sort((left, right) => {
      const leftCurrentAmount =
        contributionMap.get(byContributionCellKey(left.contributorId, currentBusinessMonth))?.amountCents ?? 0;
      const rightCurrentAmount =
        contributionMap.get(byContributionCellKey(right.contributorId, currentBusinessMonth))?.amountCents ?? 0;

      const leftCurrentState = getContributionCellState(leftCurrentAmount, monthlyAmountCents);
      const rightCurrentState = getContributionCellState(rightCurrentAmount, monthlyAmountCents);

      const stateDiff = getStatePriority(leftCurrentState) - getStatePriority(rightCurrentState);
      if (stateDiff !== 0) {
        return stateDiff;
      }

      if (left.status !== right.status) {
        return right.status - left.status;
      }

      return left.name.localeCompare(right.name, "es");
    });
  }, [contributionMap, contributors, currentBusinessMonth, monthlyAmountCents]);

  const visibleContributors = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedContributors;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return sortedContributors.filter((contributor) => contributor.name.toLowerCase().includes(lowerQuery));
  }, [searchQuery, sortedContributors]);

  const modalContributors = useMemo<Contributor[]>(() => {
    return contributors
      .filter((item) => item.status === 1)
      .map((item) => ({
        id: item.contributorId,
        name: item.name,
        email: item.email,
        status: item.status,
        auth0SyncStatus: "unknown_legacy" as const,
        auth0UserId: null,
        auth0LastSyncAt: null,
        auth0LastError: null,
        createdAt: "",
        createdBy: "",
        updatedAt: "",
        updatedBy: ""
      }));
  }, [contributors]);

  return {
    contributionMap,
    sortedContributors,
    visibleContributors,
    modalContributors
  };
};
