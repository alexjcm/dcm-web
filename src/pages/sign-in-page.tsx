import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useSearchParams } from "react-router";
import { LogIn, ShieldCheck } from "lucide-react";

import {
  canAttemptSessionRecovery,
  clearSessionRecoveryAttempt,
  markSessionRecoveryAttempt,
  normalizeReturnTo,
  SESSION_RECOVERY_QUERY_REASON,
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 sm:p-8 animate-in fade-in duration-700">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl ring-4 ring-white">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Plataforma <span className="text-primary-600 italic">DCM</span>
          </h1>
          <p className="mt-4 text-sm font-semibold tracking-widest text-slate-500 uppercase">
            Gestión de Aportes Familiares
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50">
          {isSessionRecovery ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 animate-in slide-in-from-top-2">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <p className="text-sm font-bold leading-relaxed text-amber-900">
                Tu sesión venció o no pudo verificarse. Ingresa de nuevo para continuar.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 animate-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <p className="text-sm font-bold text-rose-800 leading-relaxed">
                {error.message}
              </p>
            </div>
          ) : null}

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
            className="w-full h-12 text-base font-bold"
            icon={LogIn}
          >
            {isSessionRecovery ? "Volver a iniciar sesión" : "Entrar al Sistema"}
          </Button>

        </div>

        <p className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} DCM
        </p>
      </div>
    </main>
  );
};
