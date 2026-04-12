import type { ContributionState, ContributorStatus } from "../../types/domain";

const stateStyles: Record<ContributionState, string> = {
  pending: "bg-slate-100 text-slate-800 border-slate-300",
  incomplete: "bg-amber-100 text-amber-800 border-amber-300",
  complete: "bg-emerald-100 text-emerald-800 border-emerald-300",
  overpaid: "bg-sky-100 text-sky-800 border-sky-300"
};

const stateLabels: Record<ContributionState, string> = {
  pending: "Pendiente",
  incomplete: "Incompleto",
  complete: "Completo",
  overpaid: "Excedente"
};

export const ContributionStateBadge = ({ state }: { state: ContributionState }) => {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${stateStyles[state]}`}>
      {stateLabels[state]}
    </span>
  );
};

export const ContributorStatusBadge = ({ status }: { status: ContributorStatus }) => {
  const isActive = status === 1;

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
        isActive ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-rose-300 bg-rose-100 text-rose-800"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
};

export const getContributionCellState = (amountCents: number, monthlyAmountCents: number): ContributionState => {
  if (amountCents <= 0) {
    return "pending";
  }

  if (amountCents < monthlyAmountCents) {
    return "incomplete";
  }

  if (amountCents === monthlyAmountCents) {
    return "complete";
  }

  return "overpaid";
};
