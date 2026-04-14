import { useAuth0 } from "@auth0/auth0-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { AUTH0_AUDIENCE } from "../config/auth";
import { APP_PERMISSIONS, type AppPermission } from "../config/permissions";
import { getCurrentBusinessYear } from "../lib/business-time";
import { extractPermissionsFromAccessToken } from "../lib/permissions";
import { canMutateContributions, getContributionRestrictionMessage } from "../lib/period";

type AppContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  permissions: string[];
  permissionsLoaded: boolean;
  hasPermission: (permission: AppPermission) => boolean;
  currentBusinessYear: number;
  activeYear: number;
  setActiveYear: (year: number) => void;
  canMutateCurrentPeriod: boolean;
  contributionRestrictionMessage: string | null;
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppContextProvider = ({ children }: PropsWithChildren) => {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const currentBusinessYear = getCurrentBusinessYear();

  const [activeYear, setActiveYearState] = useState<number>(currentBusinessYear);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setPermissions([]);
      setPermissionsLoaded(true);
      return;
    }

    let active = true;
    setPermissionsLoaded(false);

    const loadPermissions = async () => {
      try {
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: AUTH0_AUDIENCE
          }
        });

        if (!active) {
          return;
        }

        setPermissions(extractPermissionsFromAccessToken(accessToken));
      } catch (error) {
        console.warn(
          "No se pudo cargar permisos desde el access token; se continuará sin permisos en cliente.",
          error
        );

        if (!active) {
          return;
        }

        setPermissions([]);
      } finally {
        if (active) {
          setPermissionsLoaded(true);
        }
      }
    };

    void loadPermissions();

    return () => {
      active = false;
    };
  }, [getAccessTokenSilently, isAuthenticated]);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const hasPermission = useCallback(
    (permission: AppPermission): boolean => {
      return permissionSet.has(permission);
    },
    [permissionSet]
  );

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

  const hasContributionWritePermission = hasPermission(APP_PERMISSIONS.contributionsWrite);
  const canMutateCurrentPeriod =
    permissionsLoaded && canMutateContributions(hasContributionWritePermission, activeYear, currentBusinessYear);

  const contributionRestrictionMessage = getContributionRestrictionMessage({
    isSignedIn: isAuthenticated,
    permissionsLoaded,
    hasContributionWritePermission,
    activeYear,
    currentBusinessYear
  });

  const value = useMemo<AppContextValue>(
    () => ({
      isLoaded: !isLoading,
      isSignedIn: isAuthenticated,
      userId: typeof user?.sub === "string" ? user.sub : null,
      userEmail: typeof user?.email === "string" ? user.email : null,
      permissions,
      permissionsLoaded,
      hasPermission,
      currentBusinessYear,
      activeYear,
      setActiveYear,
      canMutateCurrentPeriod,
      contributionRestrictionMessage
    }),
    [
      isLoading,
      isAuthenticated,
      user,
      permissions,
      permissionsLoaded,
      hasPermission,
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
