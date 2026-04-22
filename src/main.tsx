import { StrictMode } from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router";

import { App } from "./App";
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN, IS_AUTH_CONFIG_VALID } from "./config/auth";
import { AppContextProvider } from "./context/app-context";
import { clearSessionRecoveryAttempt, normalizeReturnTo } from "./lib/auth-navigation";
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
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '20px'
  }}>
    <h1 style={{ color: '#ef4444' }}>Configuración incompleta</h1>
    <p style={{ color: '#6b7280', maxWidth: '400px' }}>
      La aplicación web no puede iniciar porque faltan variables de entorno. 
      Por favor, verifica configuración en el panel de administración de tu proveedor de hosting.
    </p>
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
      useRefreshTokens
      cacheLocation="localstorage"
      authorizationParams={{
        audience: AUTH0_AUDIENCE,
        scope: "openid profile email offline_access",
        redirect_uri: window.location.origin
      }}
      onRedirectCallback={(appState) => {
        clearSessionRecoveryAttempt();
        navigate(normalizeReturnTo(appState?.returnTo), { replace: true });
      }}
    >
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </Auth0Provider>
  );
};

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigation />
    </BrowserRouter>
  </StrictMode>
);
