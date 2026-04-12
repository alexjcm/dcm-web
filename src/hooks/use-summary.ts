import { useCallback } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import type { SummaryData } from "../types/domain";

export const useSummary = (year: number) => {
  const api = useApiClient();

  const loader = useCallback(
    (signal: AbortSignal) => api.get<SummaryData>("/api/summary", { signal, query: { year } }),
    [api, year]
  );

  return useApiResource(loader, [year]);
};
