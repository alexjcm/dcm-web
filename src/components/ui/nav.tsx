import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  CalendarDays, 
  ReceiptText, 
  Settings2, 
  LogOut,
  UserCircle
} from "lucide-react";

import { APP_PERMISSIONS } from "../../config/permissions";
import { useAppContext } from "../../context/app-context";
import { Button } from "./button";

export const AppNav = () => {
  const { logout } = useAuth0();
  const { userEmail, hasPermission, contributionRestrictionMessage } = useAppContext();
  const canManageSettings = hasPermission(APP_PERMISSIONS.settingsWrite);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return `shrink-0 flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold transition-all rounded-lg sm:gap-2 sm:px-4 sm:text-sm ${
      isActive 
        ? "bg-primary-600 text-white shadow-md shadow-primary-200" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Aportes Familiares</h1>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-700">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary-600"></span>
              Panel Operativo
            </div>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600">
              <UserCircle size={16} className="text-slate-400" />
              <span className="max-w-[150px] truncate">{userEmail ?? "Usuario"}</span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              icon={LogOut} 
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              Salir
            </Button>
          </div>

          <div className="flex lg:hidden">
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              aria-label="Cerrar sesión"
            >
              Salir
            </Button>
          </div>
        </div>

        <nav className="flex items-center gap-1 pb-4 pr-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <NavLink to="/contributions" className={navLinkClass}>
            <ReceiptText size={16} className="sm:h-[18px] sm:w-[18px]" />
            Registro
          </NavLink>
          <NavLink to="/annual" className={navLinkClass}>
            <CalendarDays size={16} className="sm:h-[18px] sm:w-[18px]" />
            Seguimiento
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={16} className="sm:h-[18px] sm:w-[18px]" />
            Dashboard
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
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              {contributionRestrictionMessage}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
