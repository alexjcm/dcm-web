import { Calendar } from "lucide-react";

import { Select } from "./fields";

const MIN_YEAR_WITH_DATA = 2023;

const getYearOptions = (currentYear: number): number[] => {
  const years: number[] = [];

  for (let year = currentYear; year >= MIN_YEAR_WITH_DATA; year -= 1) {
    years.push(year);
  }

  return years;
};

type YearSelectProps = {
  activeYear: number;
  currentBusinessYear: number;
  setActiveYear: (year: number) => void;
  compact?: boolean;
  className?: string;
};

export const YearSelect = ({
  activeYear,
  currentBusinessYear,
  setActiveYear,
  compact = false,
  className = ""
}: YearSelectProps) => {
  const yearOptions = getYearOptions(currentBusinessYear);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-slate-400">
        <Calendar size={14} className="text-slate-400" />
        Año
      </div>
      <Select
        value={activeYear}
        onChange={(event) => setActiveYear(Number(event.target.value))}
        className={compact ? "h-9 min-w-[88px]" : "h-9 min-w-[100px] border-slate-200"}
        aria-label="Seleccionar año"
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Select>
    </div>
  );
};
