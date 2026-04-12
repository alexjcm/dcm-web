import { useMemo } from "react";
import { useAuth } from "@clerk/react-router";

import { ApiClient } from "../lib/http";

export const useApiClient = (): ApiClient => {
  const { getToken } = useAuth();

  return useMemo(() => {
    return new ApiClient(async () => {
      const token = await getToken();
      return token ?? null;
    });
  }, [getToken]);
};
