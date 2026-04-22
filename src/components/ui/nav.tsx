import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router";
import { 
  PieChart, 
  CalendarDays, 
  Settings2, 
  LogOut,
  Download,
  Sun,
  Moon,
  WifiOff
} from "lucide-react";

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { Fragment, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

import { APP_PERMISSIONS } from "../../config/permissions";
import { useAppContext } from "../../context/app-context";
import { useOnlineStatus } from "../../hooks/use-online-status";
import { useTheme } from "../../hooks/use-theme";
import { BeforeInstallPromptEvent, isAppleMobileDevice, isStandaloneDisplayMode } from "../../types/pwa";

export const AppNav = () => {
  const { user, logout } = useAuth0();
  const { userEmail, hasPermission, contributionRestrictionMessage } = useAppContext();
  const [imageError, setImageError] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallPromptOpen, setIsInstallPromptOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneDisplayMode());
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");
  const { theme, toggle } = useTheme();
  const isOnline = useOnlineStatus();
  const canManageSettings = hasPermission(APP_PERMISSIONS.settingsWrite);
  const canEditContributions = hasPermission(APP_PERMISSIONS.contributionsWrite);
  const showIosInstallHint = useMemo(() => isAppleMobileDevice() && !isStandalone, [isStandalone]);

  const getRoleInfo = () => {
    if (canManageSettings) {
      return {
        label: "🛡️ Administrador",
        styles: "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
      };
    }
    if (canEditContributions) {
      return {
        label: "✍️ Editor",
        styles: "border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
      };
    }
    return {
      label: "👀 Modo Lectura",
      styles: "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-500/30 dark:bg-neutral-500/10 dark:text-neutral-400"
    };
  };

  const role = getRoleInfo();
  const canInstallFromPrompt = installPromptEvent !== null;
  const showInstallAction = !isStandalone && (canInstallFromPrompt || showIosInstallHint);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstallPromptEvent(null);
      toast.success("Aplicación instalada.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return `flex min-w-0 shrink items-center justify-center gap-1 px-2 py-2 text-[12px] font-bold transition-all rounded-lg sm:justify-start sm:gap-2 sm:px-3 sm:text-sm md:px-4 ${
      isActive 
        ? "border border-primary-700 bg-primary-600 !text-white shadow-primary [&_svg]:!text-white" 
        : "text-primary-900/84 hover:bg-primary-50 hover:text-primary-900 [&_svg]:text-primary-500 dark:text-primary-300 dark:hover:bg-neutral-800 dark:hover:text-primary-200 dark:[&_svg]:text-primary-400"
    }`;
  };

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      const pendingPrompt = installPromptEvent;

      setIsInstallPromptOpen(true);
      setInstallPromptEvent(null);

      try {
        await pendingPrompt.prompt();
        const choice = await pendingPrompt.userChoice;

        if (choice.outcome !== "accepted") {
          toast.info("Puedes instalar la aplicación más tarde desde este menú.");
        }
      } catch (error) {
        console.warn("Install prompt failed.", error);
        toast.error("No fue posible iniciar la instalación.");
      } finally {
        setIsInstallPromptOpen(false);
      }

      return;
    }

    toast.message("Instalación en iPhone o iPad", {
      description: "Abre esta app en Safari o Chrome y usa Compartir > Añadir a pantalla de inicio."
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[var(--gradient-nav-header)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold uppercase tracking-[0.24em] text-primary-600 sm:text-[18px]">
              Portal DCM
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="hidden items-center gap-2 rounded-full border border-warning-300 bg-warning-50/90 px-3 py-1.5 text-xs font-bold text-warning-900 shadow-sm dark:border-warning-400/70 dark:bg-warning-400/16 dark:text-warning-50 md:flex">
                <WifiOff size={14} className="dark:text-warning-200" />
                Sin conexión
              </div>
            )}

            {/* Theme toggle — placed to the left of the avatar */}
            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Menu as="div" className="relative z-50">
              <MenuButton className="flex items-center justify-center rounded-full border border-primary-200 bg-white p-0.5 shadow-sm transition hover:ring-4 hover:ring-primary-100 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:hover:ring-primary-900/40">
                {user?.picture && !imageError ? (
                  <img 
                    src={user.picture} 
                    alt={user?.name ?? "Usuario"} 
                    className="h-9 w-9 rounded-full object-cover" 
                    onError={() => {
                      console.warn(`[Avatar] Failed to load image from external provider. Using fallback initals for: ${user?.name ?? user?.email ?? 'Unknown'}`);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800 dark:bg-primary-800/40 dark:text-primary-200">
                    {userInitial}
                  </div>
                )}
              </MenuButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-64 origin-top-right divide-y divide-border rounded-[var(--radius-card)] border border-border bg-white shadow-[var(--shadow-dropdown)] ring-1 ring-black/5 focus:outline-none dark:divide-white/5 dark:bg-neutral-800 dark:border-neutral-700 dark:ring-white/5 sm:w-64">
                  <div className="px-5 py-4">
                    <p className="truncate text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                      {user?.name ?? "Usuario"}
                    </p>
                    <p className="mb-2 truncate text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {userEmail ?? user?.email ?? "Cargando sesión..."}
                    </p>
                    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${role.styles}`}>
                      <span>{role.label}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    {showInstallAction && (
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={() => {
                              void handleInstallClick();
                            }}
                            disabled={isInstallPromptOpen}
                            className={`group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                              focus ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" : "text-neutral-700 dark:text-neutral-300"
                            }`}
                          >
                            <Download size={16} className={focus ? "text-primary-600" : "text-neutral-400 group-hover:text-primary-600"} />
                            {canInstallFromPrompt ? "Instalar aplicación" : "Cómo instalarla"}
                          </button>
                        )}
                      </MenuItem>
                    )}

                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                            focus ? "bg-danger-50 text-danger-700 dark:bg-danger-900/40 dark:text-danger-400" : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          <LogOut size={16} className={focus ? "text-danger-600" : "text-neutral-400 group-hover:text-danger-600"} />
                          Cerrar Sesión
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>

        <nav className="grid grid-cols-3 gap-1.5 pb-4 sm:flex sm:items-center sm:gap-2 sm:pb-0">
          <NavLink to="/contributions" className={navLinkClass}>
            <CalendarDays size={16} className="shrink-0" />
            <span>Aportes</span>
          </NavLink>
          <NavLink to="/summary" className={navLinkClass}>
            <PieChart size={16} className="shrink-0" />
            <span>Resumen</span>
          </NavLink>
          {canManageSettings && (
            <NavLink to="/settings" className={navLinkClass}>
              <Settings2 size={16} className="shrink-0" />
              <span>Ajustes</span>
            </NavLink>
          )}
        </nav>

        {contributionRestrictionMessage && (
          <div className="mb-4">
            <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/80 px-3 py-2 text-xs font-medium text-primary-900 shadow-sm animate-in fade-in slide-in-from-top-1 dark:border-primary-800 dark:bg-primary-950/50 dark:text-primary-200">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary-500"></span>
              {contributionRestrictionMessage}
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="mb-4">
            <div className="flex items-center gap-2 rounded-xl border border-warning-300 bg-warning-50/90 px-3 py-2 text-xs font-medium text-warning-900 shadow-sm animate-in fade-in slide-in-from-top-1 dark:border-warning-400/70 dark:bg-warning-400/16 dark:text-warning-50 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
              <WifiOff size={14} className="shrink-0 dark:text-warning-200" />
              Sin conexión: la interfaz sigue disponible, pero Auth0 y la API requieren red para renovar sesión, consultar datos y guardar cambios.
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
