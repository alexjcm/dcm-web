import { StrictMode } from "react";
import { esES } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/react-router";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./App";
import { AppContextProvider } from "./context/app-context";
import "./styles.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

if (!publishableKey.startsWith("pk_")) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY must be a Clerk publishable key (pk_...)");
}

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
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/sign-in" localization={esES}>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>
);
