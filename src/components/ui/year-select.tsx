import { Select } from "./fields";

const getYearOptions = (currentYear: number, minYear: number): number[] => {
  const years: number[] = [];
  const end = minYear;

  for (let year = currentYear; year >= end; year -= 1) {
    years.push(year);
  }

  return years;
};

type YearSelectProps = {
  activeYear: number;
  currentBusinessYear: number;
  minYear?: number;
  setActiveYear: (year: number) => void;
  compact?: boolean;
  className?: string;
};

export const YearSelect = ({
  activeYear,
  currentBusinessYear,
  minYear,
  setActiveYear,
  compact = false,
  className = ""
}: YearSelectProps) => {
  const yearOptions = getYearOptions(currentBusinessYear, minYear ?? currentBusinessYear);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-600">
        Año
      </div>

      <Select
        value={activeYear}
        onChange={(event) => setActiveYear(Number(event.target.value))}
        className={compact ? "h-10 min-w-[96px]" : "h-10 min-w-[108px]"}
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
