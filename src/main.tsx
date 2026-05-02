import { StrictMode } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router";

import { App } from "./App";
import { AppToaster } from "./components/ui/toaster";
import { AppVersionFooter } from "./components/ui/app-version-footer";
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN, IS_AUTH_CONFIG_VALID } from "./config/auth";
import { AppContextProvider } from "./context/app-context";
import { clearDefaultLoginAttempt, clearSessionRecoveryAttempt, normalizeReturnTo } from "./lib/auth-navigation";
import "./pwa";
import "./styles.css";

const PRELOAD_RELOAD_WINDOW_MS = 10_000;
const LAST_PRELOAD_RELOAD_AT_KEY = "__vite_preload_reload_at__";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  const now = Date.now();
  const lastReloadAt = Number(sessionStorage.getItem(LAST_PRELOAD_RELOAD_AT_KEY) ?? "0");

  if (now - lastReloadAt < PRELOAD_RELOAD_WINDOW_MS) {
    console.error("Vite preload error persisted after one reload attempt.");
    return;
  }

  sessionStorage.setItem(LAST_PRELOAD_RELOAD_AT_KEY, String(now));
  window.location.reload();
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element");
}

const ConfigErrorView = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <main className="flex flex-1 flex-col items-center justify-center p-5 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-danger-600">Configuración incompleta</h1>
      <p className="mt-3 max-w-[400px] text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
        La aplicación web no puede iniciar porque faltan variables de entorno.
        Por favor, verifica configuración en el panel de administración de tu proveedor de hosting.
      </p>
    </main>
    <AppVersionFooter />
  </div>
);

const Auth0ProviderWithNavigation = () => {
  const navigate = useNavigate();

  if (!IS_AUTH_CONFIG_VALID) {
    return <ConfigErrorView />;
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      cacheLocation="localstorage"
      authorizationParams={{
        audience: AUTH0_AUDIENCE,
        scope: "openid profile email",
        redirect_uri: window.location.origin
      }}
      onRedirectCallback={(appState) => {
        clearDefaultLoginAttempt();
        clearSessionRecoveryAttempt();
        const returnTo = normalizeReturnTo(appState?.returnTo);
        
        if (returnTo.includes('session_token=')) {
          try {
            const searchStr = returnTo.includes('?') ? returnTo.split('?')[1] : '';
            const params = new URLSearchParams(searchStr);
            const token = params.get('session_token');
            const lstate = params.get('link_state') || params.get('state');
            
            if (token) {
              sessionStorage.setItem('dcm_session_token', token);
              if (lstate) sessionStorage.setItem('dcm_link_state', lstate);
            }
          } catch (e) { /* ignore error */ }
        }

        setTimeout(() => {
          navigate(returnTo, { replace: true });
        }, 150);
      }}
    >
      <AuthErrorGuard>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </AuthErrorGuard>
    </Auth0Provider>
  );
};

const AuthErrorGuard = ({ children }: { children: React.ReactNode }) => {
  const { error, isLoading } = useAuth0();

  if (!isLoading && (error?.message?.includes('state') || error?.message?.includes('Invalid state'))) {
    sessionStorage.removeItem('dcm_session_token');
    sessionStorage.removeItem('dcm_link_state');
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigation />
      <AppToaster />
    </BrowserRouter>
  </StrictMode>
);
