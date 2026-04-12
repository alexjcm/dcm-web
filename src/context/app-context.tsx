import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { useAuth } from "@clerk/react-router";

import { getRoleFromClaims } from "../auth/role-claims";
import type { AppRole } from "../config/auth";
import { getCurrentBusinessYear } from "../lib/business-time";
import { canMutateContributions, getContributionRestrictionMessage } from "../lib/period";

type AppContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null | undefined;
  role: AppRole | null;
  currentBusinessYear: number;
  activeYear: number;
  setActiveYear: (year: number) => void;
  canMutateCurrentPeriod: boolean;
  contributionRestrictionMessage: string | null;
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppContextProvider = ({ children }: PropsWithChildren) => {
  const { isLoaded, isSignedIn, userId, sessionClaims } = useAuth();
  const currentBusinessYear = getCurrentBusinessYear();

  const [activeYear, setActiveYearState] = useState<number>(currentBusinessYear);

  const role = useMemo(() => {
    if (!isSignedIn) {
      return null;
    }

    return getRoleFromClaims(sessionClaims as Record<string, unknown> | null | undefined);
  }, [isSignedIn, sessionClaims]);

  const setActiveYear = (year: number) => {
    if (!Number.isFinite(year)) {
      return;
    }

    const normalized = Math.trunc(year);

    if (normalized < 2000 || normalized > 2100) {
      return;
    }

    setActiveYearState(normalized);
  };

  const canMutateCurrentPeriod = canMutateContributions(role, activeYear, currentBusinessYear);
  const contributionRestrictionMessage = getContributionRestrictionMessage(role, activeYear, currentBusinessYear);

  const value = useMemo<AppContextValue>(
    () => ({
      isLoaded,
      isSignedIn,
      userId,
      role,
      currentBusinessYear,
      activeYear,
      setActiveYear,
      canMutateCurrentPeriod,
      contributionRestrictionMessage
    }),
    [
      isLoaded,
      isSignedIn,
      userId,
      role,
      currentBusinessYear,
      activeYear,
      canMutateCurrentPeriod,
      contributionRestrictionMessage
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext debe usarse dentro de AppContextProvider");
  }

  return context;
};
