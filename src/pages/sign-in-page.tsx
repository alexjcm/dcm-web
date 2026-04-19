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

export const SignInPage = () => {
  const { isLoading, isAuthenticated, error, loginWithRedirect } = useAuth0();
  const [searchParams] = useSearchParams();
  const [autoRedirecting, setAutoRedirecting] = useState<boolean>(false);

  const returnTo = useMemo(() => normalizeReturnTo(searchParams.get("returnTo")), [searchParams]);
  const reason = searchParams.get("reason");
  const isSessionRecovery = isSessionRecoveryReason(reason);
  const canAutoRecover = isSessionRecovery && canAttemptSessionRecovery(returnTo);

  useEffect(() => {
    if (!isSessionRecovery || !canAutoRecover || isLoading) {
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
      console.warn("No se pudo redirigir automáticamente al login.", redirectError);
      setAutoRedirecting(false);
    });
  }, [canAutoRecover, isLoading, isSessionRecovery, loginWithRedirect, returnTo]);

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
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),transparent)]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(239,246,255,0.88))] px-6 py-8 shadow-dialog ring-1 ring-white/70 sm:min-h-[360px] sm:px-8 sm:py-9">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[1.3rem] border border-primary-100 bg-primary-600 text-white shadow-primary sm:h-[4.6rem] sm:w-[4.6rem]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-base font-bold uppercase tracking-[0.22em] text-primary-600 sm:text-lg">Portal DCM</p>
              <h1 className="mt-1.5 text-lg font-medium leading-relaxed text-neutral-700 sm:text-xl">Gestión de Aportes Familiares</h1>
            </div>
          </div>

          {isSessionRecovery ? (
            <div className="mb-6 flex items-start gap-3 rounded-[1.15rem] border border-warning-300 bg-warning-100/60 p-4 animate-in slide-in-from-top-2">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning-600" />
              <p className="text-sm font-semibold leading-relaxed text-warning-950">
                Tu sesión venció o no pudo verificarse. Ingresa de nuevo para continuar.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-[1.15rem] border border-danger-300 bg-danger-100/70 p-4 animate-in slide-in-from-top-2">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger-600" />
              <p className="text-sm font-semibold leading-relaxed text-danger-900">
                {error.message}
              </p>
            </div>
          ) : null}


          <div className="mt-8 pt-1">
            <Button
              onClick={() => {
                clearSessionRecoveryAttempt();
                void loginWithRedirect({
                  appState: { returnTo },
                  authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE
                  }
                });
              }}
              className="h-14 w-full text-base font-bold"
              icon={LogIn}
            >
              {isSessionRecovery ? "Volver a iniciar sesión" : "Entrar al Sistema"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
