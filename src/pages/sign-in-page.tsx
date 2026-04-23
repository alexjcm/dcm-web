import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useSearchParams } from "react-router";
import { LogIn, ShieldCheck } from "lucide-react";

import {
  canAttemptSessionRecovery,
  clearSessionRecoveryAttempt,
  markSessionRecoveryAttempt,
  normalizeReturnTo,
  isSessionRecoveryReason
} from "../lib/auth-navigation";
import { PageLoader } from "../components/ui/loaders";
import { Button } from "../components/ui/button";
import { useOnlineStatus } from "../hooks/use-online-status";
import { isAuthNetworkError, getFriendlyAuthErrorMessage } from "../lib/auth-session";

export const SignInPage = () => {
  const { isLoading, isAuthenticated, error, loginWithRedirect } = useAuth0();
  const [searchParams] = useSearchParams();
  const [autoRedirecting, setAutoRedirecting] = useState<boolean>(false);
  const [autoRedirectError, setAutoRedirectError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const returnTo = useMemo(() => normalizeReturnTo(searchParams.get("returnTo")), [searchParams]);
  const reason = searchParams.get("reason");
  const isSessionRecovery = isSessionRecoveryReason(reason);
  const canAutoRecover = isSessionRecovery && canAttemptSessionRecovery(returnTo);

  useEffect(() => {
    setAutoRedirectError(null);

    if (!isSessionRecovery || !canAutoRecover || isLoading || !isOnline) {
      setAutoRedirecting(false);
      return;
    }

    markSessionRecoveryAttempt(returnTo);
    setAutoRedirecting(true);

    void loginWithRedirect({
      appState: { returnTo },
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }
    }).catch((redirectError) => {
      console.warn("Auto-redirect to login failed.", redirectError);
      setAutoRedirecting(false);
      setAutoRedirectError(
        isAuthNetworkError(redirectError)
          ? "No se puede recuperar la sesión sin conexión a Auth0. Verifica tu red e inténtalo de nuevo."
          : "No fue posible redirigirte al inicio de sesión. Inténtalo nuevamente."
      );
    });
  }, [canAutoRecover, isLoading, isOnline, isSessionRecovery, loginWithRedirect, returnTo]);

  useEffect(() => {
    if (!isAuthenticated || isSessionRecovery) {
      return;
    }

    clearSessionRecoveryAttempt();
  }, [isAuthenticated, isSessionRecovery]);

  if (isLoading) {
    return <PageLoader label="Cargando autenticación..." />;
  }

  if (isAuthenticated && !isSessionRecovery) {
    return <Navigate to={returnTo} replace />;
  }

  if (autoRedirecting) {
    return <PageLoader label="Tu sesión venció. Redirigiendo al ingreso..." />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 sm:p-8 animate-in fade-in duration-700">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[14%] h-48 w-48 rounded-full bg-[rgba(37,99,235,0.12)] blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] h-64 w-64 rounded-full bg-[rgba(143,168,216,0.18)] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-48 bg-[var(--gradient-signin-mask)]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="overflow-hidden rounded-[var(--radius-dialog)] border border-border bg-[var(--gradient-signin)] px-6 py-8 shadow-dialog ring-1 ring-white/70 sm:min-h-[360px] sm:px-8 sm:py-9 dark:ring-white/10">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-primary-100 bg-primary-600 text-white shadow-primary sm:h-[4.6rem] sm:w-[4.6rem]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-base font-bold uppercase tracking-[0.22em] text-primary-600 sm:text-lg">Portal DCM</p>
              <h1 className="mt-1.5 text-lg font-medium leading-relaxed text-neutral-700 sm:text-xl dark:text-neutral-300">Gestión de Aportes Familiares</h1>
            </div>
          </div>

          {isSessionRecovery ? (
            <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-alert)] border border-warning-300 bg-warning-100/60 p-4 animate-in slide-in-from-top-2 dark:border-warning-700 dark:bg-warning-950/60">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning-600" />
              <p className="text-sm font-semibold leading-relaxed text-warning-950 dark:text-warning-300">
                {!isOnline
                  ? "Sin conexión: no es posible recuperar ni renovar la sesión con Auth0 hasta que vuelva la red."
                  : "Tu sesión venció o no pudo verificarse. Ingresa de nuevo para continuar."}
              </p>
            </div>
          ) : null}

          {autoRedirectError ? (
            <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-alert)] border border-danger-400 bg-danger-100 p-4 animate-in slide-in-from-top-2 dark:border-danger-700 dark:bg-danger-950">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger-600" />
              <p className="text-sm font-bold leading-relaxed text-danger-950 dark:text-danger-200">
                {autoRedirectError}
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-alert)] border border-danger-300 bg-danger-100 p-4 animate-in slide-in-from-top-2 dark:border-danger-800 dark:bg-danger-900">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger-600" />
              <p className="text-sm font-bold leading-relaxed text-danger-900 dark:text-danger-50">
                {(() => {
                  console.error("Original error:", error);
                  console.groupEnd();
                  return getFriendlyAuthErrorMessage(error);
                })()}
              </p>
            </div>
          ) : null}

          {!isOnline ? (
            <p className="mb-6 text-sm font-medium leading-relaxed text-neutral-600 dark:text-neutral-400">
              La interfaz puede abrirse sin conexión, pero iniciar sesión o renovar la sesión requiere conectividad con Auth0.
            </p>
          ) : null}


          <div className="mt-8 pt-1">
            <Button
              onClick={() => {
                clearSessionRecoveryAttempt();

                if (!isOnline) {
                  return;
                }

                void loginWithRedirect({
                  appState: { returnTo },
                  authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                    ...(error ? { prompt: "login" } : {})
                  }
                });
              }}
              className="h-14 w-full text-base font-bold"
              disabled={!isOnline}
              icon={LogIn}
            >
              {!isOnline
                ? "Sin conexión para ingresar"
                : isSessionRecovery
                  ? "Volver a iniciar sesión"
                  : "Entrar al Sistema"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
