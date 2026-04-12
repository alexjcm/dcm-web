import { NavLink } from "react-router";
import { UserButton } from "@clerk/react-router";

import { useAppContext } from "../../context/app-context";

const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
  return `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-slate-100"
  }`;
};

const getYearOptions = (currentYear: number): number[] => {
  const years: number[] = [];

  for (let year = currentYear + 1; year >= currentYear - 8; year -= 1) {
    years.push(year);
  }

  return years;
};

export const AppNav = () => {
  const { activeYear, setActiveYear, currentBusinessYear, role, contributionRestrictionMessage } = useAppContext();
  const yearOptions = getYearOptions(currentBusinessYear);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Gestión de Aportes Familiares</p>
            <h1 className="text-lg font-bold text-slate-900">Panel operativo</h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <span className="text-slate-600">Año</span>
              <select
                value={activeYear}
                onChange={(event) => setActiveYear(Number(event.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                aria-label="Año activo"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Rol: {role ?? "sin-rol"}
            </div>

            <UserButton />
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/annual" className={navLinkClass}>
            Vista anual
          </NavLink>
          <NavLink to="/contributions" className={navLinkClass}>
            Aportes
          </NavLink>
          {role === "superadmin" ? (
            <NavLink to="/settings" className={navLinkClass}>
              Ajustes
            </NavLink>
          ) : null}
        </nav>

        {contributionRestrictionMessage ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {contributionRestrictionMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
};
