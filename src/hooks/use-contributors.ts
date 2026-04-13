import { useCallback } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { ContributorsListData } from "../types/domain";

export type ContributorStatusFilter = "active" | "all";

export const useContributors = (status: ContributorStatusFilter = "active") => {
  const api = useApiClient();

  const loader = useCallback(
    (signal: AbortSignal) => api.get<ContributorsListData>("/api/contributors", { signal, query: { status } }),
    [api, status]
  );

  return useApiResource(loader, [status], [RESOURCE_KEYS.contributors]);
};
