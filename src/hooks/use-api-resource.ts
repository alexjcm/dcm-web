import { useCallback, useEffect, useState } from "react";

import type { ApiResponse } from "../types/api";
import type { ResourceKey } from "../lib/resource-invalidation";
import { useResourceVersion } from "./use-resource-invalidation";

type Loader<T> = (signal: AbortSignal) => Promise<ApiResponse<T>>;
const UNEXPECTED_RESOURCE_ERROR = "No fue posible cargar el recurso.";

const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === "AbortError";
};

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export const useApiResource = <T>(
  loader: Loader<T>,
  deps: ReadonlyArray<unknown>,
  invalidationKeys: ReadonlyArray<ResourceKey> = [],
  enabled: boolean = true
): ResourceState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const invalidationVersion = useResourceVersion(invalidationKeys);

  const reload = useCallback(() => {
    setReloadNonce((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await loader(controller.signal);

        if (!active) {
          return;
        }

        if (response.ok) {
          setData(response.data);
          setLoading(false);
          return;
        }

        if (response.error.code === "REQUEST_ABORTED") {
          setLoading(false);
          return;
        }

        setError(response.error.detail);
        setLoading(false);
      } catch (error) {
        if (!active) {
          return;
        }

        if (controller.signal.aborted || isAbortError(error)) {
          setLoading(false);
          return;
        }

        console.error("Unexpected resource loader failure.", error);
        setError(UNEXPECTED_RESOURCE_ERROR);
        setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, loader, reloadNonce, invalidationVersion, ...deps]);

  return {
    data,
    loading,
    error,
    reload
  };
};
