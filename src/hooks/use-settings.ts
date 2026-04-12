import { useCallback, useMemo } from "react";

import { useApiClient } from "./use-api-client";
import { useApiResource } from "./use-api-resource";
import type { SettingsData } from "../types/domain";

const DEFAULT_MONTHLY_AMOUNT_CENTS = 3200;

export const useSettings = () => {
  const api = useApiClient();

  const loader = useCallback((signal: AbortSignal) => api.get<SettingsData>("/api/settings", { signal }), [api]);

  const resource = useApiResource(loader, []);

  const monthlyAmountCents = useMemo(() => {
    const raw = resource.data?.items.find((item) => item.key === "monthly_amount_cents")?.value;
    const parsed = raw ? Number(raw) : Number.NaN;

    if (!Number.isFinite(parsed) || parsed < 1) {
      return DEFAULT_MONTHLY_AMOUNT_CENTS;
    }

    return Math.trunc(parsed);
  }, [resource.data]);

  return {
    ...resource,
    monthlyAmountCents
  };
};
