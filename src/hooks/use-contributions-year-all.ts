import { useCallback } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { ApiResponse } from "../types/api";
import type { Contribution, ContributionsListData } from "../types/domain";

type AllContributionsForYearData = {
  items: Contribution[];
};

export const useContributionsYearAll = (year: number) => {
  const api = useApiClient();

  const loader = useCallback(
    async (signal: AbortSignal): Promise<ApiResponse<AllContributionsForYearData>> => {
      const response = await api.get<ContributionsListData>("/api/contributions", {
        signal,
        query: {
          year,
          all: "true"
        }
      });

      if (!response.ok) {
        return response;
      }

      return {
        ok: true,
        status: 200,
        data: { items: response.data.items },
        error: null
      };
    },
    [api, year]
  );

  return useApiResource(loader, [year], [RESOURCE_KEYS.contributions]);
};
