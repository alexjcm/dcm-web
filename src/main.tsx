import { StrictMode } from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./App";
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN } from "./config/auth";
import { AppContextProvider } from "./context/app-context";
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

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          audience: AUTH0_AUDIENCE,
          redirect_uri: window.location.origin
        }}
      >
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
);
