import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  getInvalidationSnapshot,
  invalidateResources,
  type ResourceKey,
  subscribeInvalidation
} from "../lib/resource-invalidation";

export const useResourceVersion = (keys: ReadonlyArray<ResourceKey>): number => {
  const snapshot = useSyncExternalStore(subscribeInvalidation, getInvalidationSnapshot, getInvalidationSnapshot);

  return useMemo(() => {
    return keys.reduce((acc, key) => acc + snapshot[key], 0);
  }, [keys, snapshot]);
};

export const useInvalidateResources = () => {
  return useCallback((...keys: ReadonlyArray<ResourceKey>) => {
    invalidateResources(...keys);
  }, []);
};
