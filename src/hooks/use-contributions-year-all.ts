import { useCallback } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { ApiResponse } from "../types/api";
import type { Contribution, ContributionsListData } from "../types/domain";

type AllContributionsForYearData = {
  items: Contribution[];
};

const PAGE_SIZE = 100;
const PAGE_BATCH_SIZE = 4;

export const useContributionsYearAll = (year: number) => {
  const api = useApiClient();

  const loader = useCallback(
    async (signal: AbortSignal): Promise<ApiResponse<AllContributionsForYearData>> => {
      const firstPageResponse = await api.get<ContributionsListData>("/api/contributions", {
        signal,
        query: {
          year,
          "page[number]": 1,
          "page[size]": PAGE_SIZE
        }
      });

      if (!firstPageResponse.ok) {
        return firstPageResponse;
      }

      const totalPages = firstPageResponse.data.pagination.totalPages;
      const allItems = [...firstPageResponse.data.items];

      if (totalPages <= 1) {
        return {
          ok: true,
          status: 200,
          data: { items: allItems },
          error: null
        };
      }

      const pages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);

      for (let index = 0; index < pages.length; index += PAGE_BATCH_SIZE) {
        const batch = pages.slice(index, index + PAGE_BATCH_SIZE);

        const batchResponses = await Promise.all(
          batch.map((pageNumber) =>
            api.get<ContributionsListData>("/api/contributions", {
              signal,
              query: {
                year,
                "page[number]": pageNumber,
                "page[size]": PAGE_SIZE
              }
            })
          )
        );

        for (const response of batchResponses) {
          if (!response.ok) {
            return response;
          }

          allItems.push(...response.data.items);
        }
      }

      return {
        ok: true,
        status: 200,
        data: { items: allItems },
        error: null
      };
    },
    [api, year]
  );

  return useApiResource(loader, [year], [RESOURCE_KEYS.contributions]);
};
