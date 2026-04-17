import { useCallback, useMemo } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { ApiResponse } from "../types/api";
import type { Contribution, ContributionsListData } from "../types/domain";

type ContributionsByYearData = {
  itemsByYear: Record<number, Contribution[]>;
};

export const useContributionsYearsAll = (years: number[]) => {
  const api = useApiClient();

  const normalizedYears = useMemo(() => {
    return [...years].sort((left, right) => right - left);
  }, [years]);
  const yearsKey = useMemo(() => normalizedYears.join(","), [normalizedYears]);

  const loader = useCallback(
    async (signal: AbortSignal): Promise<ApiResponse<ContributionsByYearData>> => {
      const uniqueYears = Array.from(new Set(normalizedYears));

      const responses = await Promise.all(
        uniqueYears.map(async (year) => {
          const response = await api.get<ContributionsListData>("/api/contributions", {
            signal,
            query: {
              year,
              all: "true"
            }
          });

          return { year, response };
        })
      );

      const itemsByYear: Record<number, Contribution[]> = {};

      for (const entry of responses) {
        if (!entry.response.ok) {
          return entry.response;
        }

        itemsByYear[entry.year] = entry.response.data.items;
      }

      return {
        ok: true,
        status: 200,
        data: { itemsByYear },
        error: null
      };
    },
    [api, yearsKey]
  );

  return useApiResource(loader, [yearsKey], [RESOURCE_KEYS.contributions]);
};
