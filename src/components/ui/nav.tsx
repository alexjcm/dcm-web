import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  CalendarDays, 
  ReceiptText, 
  Settings2, 
  LogOut,
  Calendar,
  UserCircle
} from "lucide-react";

import { APP_PERMISSIONS } from "../../config/permissions";
import { useAppContext } from "../../context/app-context";
import { Button } from "./button";
import { Select } from "./fields";

const MIN_YEAR_WITH_DATA = 2023;

const getYearOptions = (currentYear: number): number[] => {
  const years: number[] = [];
  for (let year = currentYear; year >= MIN_YEAR_WITH_DATA; year -= 1) {
    years.push(year);
  }
  return years;
};

export const AppNav = () => {
  const { logout } = useAuth0();
  const {
    activeYear,
    setActiveYear,
    currentBusinessYear,
    userEmail,
    hasPermission,
    contributionRestrictionMessage
  } = useAppContext();

  const yearOptions = getYearOptions(currentBusinessYear);
  const canManageSettings = hasPermission(APP_PERMISSIONS.settingsWrite);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return `flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all rounded-lg ${
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                <Calendar size={14} className="text-slate-400" />
                Año Fiscal
              </div>
              <Select
                value={activeYear}
                onChange={(e) => setActiveYear(Number(e.target.value))}
                className="h-9 min-w-[100px] border-slate-200"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </div>

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
             <Select
                value={activeYear}
                onChange={(e) => setActiveYear(Number(e.target.value))}
                className="h-9 min-w-[80px]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
          </div>
        </div>

        <nav className="flex items-center gap-1 pb-4 overflow-x-auto scrollbar-hide">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/annual" className={navLinkClass}>
            <CalendarDays size={18} />
            Vista Anual
          </NavLink>
          <NavLink to="/contributions" className={navLinkClass}>
            <ReceiptText size={18} />
            Aportes
          </NavLink>
          {canManageSettings && (
            <NavLink to="/settings" className={navLinkClass}>
              <Settings2 size={18} />
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

