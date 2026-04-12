const MONTH_FORMATTER = new Intl.DateTimeFormat("es-EC", { month: "short", timeZone: "America/Guayaquil" });

export const getMonthLabel = (month: number): string => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Mes";
  }

  return MONTH_FORMATTER.format(new Date(Date.UTC(2026, month - 1, 1))).replace(".", "");
};
