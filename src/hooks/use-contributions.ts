import { useCallback } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { ContributionsListData } from "../types/domain";

export type UseContributionsParams = {
  year: number;
  contributorId: number | null;
  pageNumber: number;
  pageSize: number;
};

export const useContributions = ({ year, contributorId, pageNumber, pageSize }: UseContributionsParams) => {
  const api = useApiClient();

  const loader = useCallback(
    (signal: AbortSignal) =>
      api.get<ContributionsListData>("/api/contributions", {
        signal,
        query: {
          year,
          contributorId,
          "page[number]": pageNumber,
          "page[size]": pageSize
        }
      }),
    [api, year, contributorId, pageNumber, pageSize]
  );

  return useApiResource(loader, [year, contributorId, pageNumber, pageSize], [RESOURCE_KEYS.contributions]);
};
