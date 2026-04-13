import { BUSINESS_TIMEZONE } from "../config/app";

const YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIMEZONE,
  year: "numeric"
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIMEZONE,
  month: "numeric"
});

export const getCurrentBusinessYear = (): number => {
  const year = Number(YEAR_FORMATTER.format(new Date()));
  return Number.isFinite(year) ? year : new Date().getFullYear();
};

export const getCurrentBusinessMonth = (): number => {
  const month = Number(MONTH_FORMATTER.format(new Date()));
  return Number.isFinite(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
};
