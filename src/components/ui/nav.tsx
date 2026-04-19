import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router";
import { 
  PieChart, 
  CalendarDays, 
  ReceiptText, 
  Settings2, 
  LogOut,
  UserCircle
} from "lucide-react";

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { Fragment } from "react";

import { APP_PERMISSIONS } from "../../config/permissions";
import { useAppContext } from "../../context/app-context";

export const AppNav = () => {
  const { user, logout } = useAuth0();
  const { userEmail, hasPermission, contributionRestrictionMessage } = useAppContext();
  const canManageSettings = hasPermission(APP_PERMISSIONS.settingsWrite);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return `flex shrink-0 items-center gap-1 px-2.5 py-2 text-[13px] font-semibold transition-all rounded-lg sm:gap-2 sm:px-3 sm:text-sm md:px-4 ${
      isActive 
        ? "border border-primary-700 bg-primary-600 !text-white shadow-primary [&_svg]:!text-white" 
        : "text-primary-900/84 hover:bg-primary-50 hover:text-primary-900 [&_svg]:text-primary-500"
    }`;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,249,252,0.9))] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold uppercase tracking-[0.24em] text-primary-600 sm:text-[18px]">
              Portal DCM
            </h1>
          </div>

          <div className="flex items-center">
            <Menu as="div" className="relative z-50">
              <MenuButton className="flex items-center justify-center rounded-full border border-primary-200 bg-white p-0.5 shadow-sm transition hover:ring-4 hover:ring-primary-100 focus:outline-none">
                {user?.picture ? (
                  <img src={user.picture} alt={user?.name ?? "Usuario"} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <UserCircle size={20} />
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
                <MenuItems className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-border rounded-[1.25rem] border border-border bg-white shadow-[0_10px_35px_rgba(0,0,0,0.08)] ring-1 ring-black/5 focus:outline-none">
                  <div className="px-5 py-4">
                    <p className="truncate text-sm font-extrabold text-neutral-900">
                      {user?.name ?? "Usuario"}
                    </p>
                    <p className="mb-2 truncate text-xs font-semibold text-neutral-500">
                      {userEmail ?? user?.email ?? "Cargando sesión..."}
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-warning-200 bg-warning-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-warning-800 shadow-sm">
                      <span>{canManageSettings ? "🛡️ Administrador" : "👀 Modo Lectura"}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                            focus ? "bg-danger-50 text-danger-700" : "text-neutral-700"
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

        <nav className="flex items-center gap-1 overflow-x-auto pb-4 pr-4 whitespace-nowrap scrollbar-hide sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pr-0 sm:whitespace-normal">
          <NavLink to="/contributions" className={navLinkClass}>
            <CalendarDays size={16} className="sm:h-[18px] sm:w-[18px]" />
            Aportes
          </NavLink>
          <NavLink to="/summary" className={navLinkClass}>
            <PieChart size={16} className="sm:h-[18px] sm:w-[18px]" />
            Resumen
          </NavLink>
          {canManageSettings && (
            <NavLink to="/settings" className={navLinkClass}>
              <Settings2 size={16} className="sm:h-[18px] sm:w-[18px]" />
              Ajustes
            </NavLink>
          )}
        </nav>

        {contributionRestrictionMessage && (
          <div className="mb-4">
            <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/80 px-3 py-2 text-xs font-medium text-primary-900 shadow-sm animate-in fade-in slide-in-from-top-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary-500"></span>
              {contributionRestrictionMessage}
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
