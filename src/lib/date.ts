const MONTH_FORMATTER = new Intl.DateTimeFormat("es-EC", { month: "short", timeZone: "America/Guayaquil" });
const MONTH_LONG_FORMATTER = new Intl.DateTimeFormat("es-EC", { month: "long", timeZone: "America/Guayaquil" });

export const getMonthLabel = (month: number): string => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Mes";
  }

  return MONTH_FORMATTER.format(new Date(Date.UTC(2026, month - 1, 1))).replace(".", "");
};

export const getMonthLongLabel = (month: number): string => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Mes";
  }

  const label = MONTH_LONG_FORMATTER.format(new Date(Date.UTC(2026, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
};
