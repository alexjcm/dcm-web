import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useSearchParams } from "react-router";
import { LogIn, ShieldCheck } from "lucide-react";

import { AppVersionFooter } from "../components/ui/app-version-footer";
import { Button } from "../components/ui/button";
import { PageLoader } from "../components/ui/loaders";
import { useOnlineStatus } from "../hooks/use-online-status";
import { canAttemptDefaultLogin, clearDefaultLoginAttempt, markDefaultLoginAttempt } from "../lib/auth-navigation";
import { getFriendlyAuthErrorMessage, isAuthNetworkError } from "../lib/auth-session";

const AUTH_LOGIN_RETURN_TO = "/contributions";

export const AuthLoginPage = () => {
  const { isLoading, isAuthenticated, error, loginWithRedirect } = useAuth0();
  const [searchParams] = useSearchParams();
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [autoRedirectError, setAutoRedirectError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const issuer = searchParams.get("iss");

  useEffect(() => {
    setAutoRedirectError(null);

    if (isLoading || isAuthenticated) {
      return;
    }

    if (!isOnline) {
      setAutoRedirecting(false);
      setAutoRedirectError("No es posible volver a iniciar sesión sin conexión a Auth0. Verifica tu red e inténtalo de nuevo.");
      return;
    }

    if (!canAttemptDefaultLogin()) {
      setAutoRedirecting(false);
      setAutoRedirectError("No fue posible reabrir el inicio de sesión automáticamente. Inténtalo manualmente.");
      return;
    }

    markDefaultLoginAttempt();
    setAutoRedirecting(true);

    void loginWithRedirect({
      appState: { returnTo: AUTH_LOGIN_RETURN_TO },
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }
    }).catch((redirectError) => {
      console.warn("Default login route redirect failed.", redirectError);
      setAutoRedirecting(false);
      setAutoRedirectError(
        isAuthNetworkError(redirectError)
          ? "No se puede redirigir a Auth0 por un problema de red. Verifica tu conexión e inténtalo de nuevo."
          : "No fue posible volver a abrir el inicio de sesión. Inténtalo manualmente."
      );
    });
  }, [isAuthenticated, isLoading, isOnline, loginWithRedirect]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    clearDefaultLoginAttempt();
  }, [isAuthenticated]);

  if (isLoading || autoRedirecting) {
    return <PageLoader label="Redirigiendo al inicio de sesión..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={AUTH_LOGIN_RETURN_TO} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-8 animate-in fade-in duration-700">
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
                <p className="text-xl font-bold uppercase tracking-[0.22em] text-primary-600 sm:text-2xl">DCM</p>
                <h1 className="mt-1.5 text-lg font-medium leading-relaxed text-neutral-700 sm:text-xl dark:text-neutral-300">
                  Volver al inicio de sesión
                </h1>
              </div>
            </div>

            <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-alert)] border border-primary-200 bg-primary-50/80 p-4 animate-in slide-in-from-top-2 dark:border-primary-900 dark:bg-primary-950/40">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
              <p className="text-sm font-semibold leading-relaxed text-primary-950 dark:text-primary-200">
                Se requiere volver a iniciar sesión para continuar en DCM.
              </p>
            </div>

            {issuer ? (
              <p className="mb-6 text-sm font-medium leading-relaxed text-neutral-600 dark:text-neutral-400">
                Regreso iniciado por el proveedor de identidad configurado para esta aplicación.
              </p>
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
                  {getFriendlyAuthErrorMessage(error)}
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 pt-1">
              <Button
                onClick={() => {
                  clearDefaultLoginAttempt();

                  if (!isOnline) {
                    return;
                  }

                  markDefaultLoginAttempt();
                  setAutoRedirecting(true);

                  void loginWithRedirect({
                    appState: { returnTo: AUTH_LOGIN_RETURN_TO },
                    authorizationParams: {
                      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                      prompt: "login"
                    }
                  }).catch((redirectError) => {
                    console.warn("Manual default login route redirect failed.", redirectError);
                    setAutoRedirecting(false);
                    setAutoRedirectError(
                      isAuthNetworkError(redirectError)
                        ? "No se puede redirigir a Auth0 por un problema de red. Verifica tu conexión e inténtalo de nuevo."
                        : "No fue posible abrir el inicio de sesión. Inténtalo manualmente desde la página de ingreso."
                    );
                  });
                }}
                className="h-14 w-full text-base font-bold"
                disabled={!isOnline}
                icon={LogIn}
              >
                {!isOnline ? "Sin conexión para ingresar" : "Continuar al inicio de sesión"}
              </Button>

              <Button
                onClick={() => {
                  clearDefaultLoginAttempt();
                  window.location.assign("/sign-in");
                }}
                className="h-12 w-full text-sm font-bold"
                variant="outline"
              >
                Ir a la pantalla de ingreso
              </Button>
            </div>
          </div>
        </div>
      </main>
      <AppVersionFooter />
    </div>
  );
};
