import { BUSINESS_TIMEZONE } from "../config/app";

const YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric"
});

export const getCurrentBusinessYear = (): number => {
  const year = Number(YEAR_FORMATTER.format(new Date()));
  return Number.isFinite(year) ? year : new Date().getFullYear();
};
