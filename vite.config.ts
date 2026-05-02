import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const toOriginPattern = (value: string | undefined): RegExp | null => {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return new RegExp(`^${escapeRegex(url.origin)}/.*`);
  } catch {
    return null;
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const auth0Domain = env.VITE_AUTH0_DOMAIN?.trim();
  const apiBaseUrl = (env.VITE_API_BASE_URL ?? "http://localhost:8787").trim();

  const auth0Pattern = auth0Domain
    ? toOriginPattern(`https://${auth0Domain.replace(/^https?:\/\//, "")}`)
    : null;
  const apiPattern = toOriginPattern(apiBaseUrl);

  const runtimeCaching = [
    ...(apiPattern
      ? [
          {
            urlPattern: apiPattern,
            handler: "NetworkOnly" as const,
            options: {
              cacheName: "api-network-only"
            }
          }
        ]
      : []),
    ...(auth0Pattern
      ? [
          {
            urlPattern: auth0Pattern,
            handler: "NetworkOnly" as const,
            options: {
              cacheName: "auth-network-only"
            }
          }
        ]
      : [])
  ];

  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version)
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        includeAssets: [
          "favicon.png",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-512x512.png"
        ],
        manifest: {
          id: "/",
          name: "DCM • Gestion de Aportes",
          short_name: "DCM",
          description: "Aplicacion interna para gestionar aportes económicos con autenticacion Auth0.",
          start_url: "/contributions",
          scope: "/",
          display: "standalone",
          theme_color: "#2563eb",
          background_color: "#ffffff",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        workbox: {
          navigateFallback: "index.html",
          cleanupOutdatedCaches: true,
          runtimeCaching
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router"],
            auth0: ["@auth0/auth0-react"],
            ui: ["@headlessui/react", "sonner"]
          }
        }
      }
    }
  };
});
