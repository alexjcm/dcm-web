export type ContributorStatus = 0 | 1;
export type ContributionState = "pending" | "incomplete" | "complete" | "overpaid";

export type Contributor = {
  id: number;
  name: string;
  email: string | null;
  status: ContributorStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type Contribution = {
  id: number;
  contributorId: number;
  contributorName: string;
  contributorStatus?: ContributorStatus;
  year: number;
  month: number;
  amountCents: number;
  status: ContributorStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type Pagination = {
  number: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ContributionsListData = {
  items: Contribution[];
  pagination: Pagination;
};

export type ContributorsListData = {
  items: Contributor[];
};

export type SummaryContributor = {
  contributorId: number;
  name: string;
  email: string | null;
  status: ContributorStatus;
  totalPaidCents: number;
  expectedCents: number;
  differenceCents: number;
  monthsComplete: number;
  monthsPendingOrIncomplete: number;
  state: ContributionState;
};

export type SummaryData = {
  year: number;
  monthlyAmountCents: number;
  totals: {
    collectedCents: number;
    expectedCents: number;
    differenceCents: number;
    contributorsCount: number;
    activeContributorsCount: number;
    inactiveContributorsCount: number;
  };
  contributors: SummaryContributor[];
};

export type SettingItem = {
  key: string;
  value: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type SettingsData = {
  items: SettingItem[];
};
