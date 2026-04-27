import { useCallback } from "react";
 
import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { ContributionsMetaData } from "../types/domain";
 
export const useContributionsMeta = (year: number) => {
  const api = useApiClient();
 
  const loader = useCallback(
    (signal: AbortSignal) => api.get<ContributionsMetaData>("/api/contributions/meta", { signal, query: { year } }),
    [api, year]
  );
 
  return useApiResource(loader, [year], [RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary]);
};
