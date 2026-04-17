import type { Contribution } from "./domain";

export type ContributionsMonthGroup = {
  key: string;
  label: string;
  month: number;
  year: number;
  items: Contribution[];
};

export type ContributionsYearGroup = {
  year: number;
  months: ContributionsMonthGroup[];
};
