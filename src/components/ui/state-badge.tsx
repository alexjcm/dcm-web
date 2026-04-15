import type { ContributionState, ContributorStatus } from "../../types/domain";

const stateStyles: Record<ContributionState, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  incomplete: "bg-amber-50 text-amber-700 border-amber-200",
  complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overpaid: "bg-indigo-50 text-indigo-700 border-indigo-200"
};

const stateLabels: Record<ContributionState, string> = {
  pending: "Pendiente",
  incomplete: "Incompleto",
  complete: "Completo",
  overpaid: "Excedente"
};

export const ContributionStateBadge = ({ state }: { state: ContributionState }) => {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${stateStyles[state]}`}>
      {stateLabels[state]}
    </span>
  );
};

export const ContributorStatusBadge = ({ status }: { status: ContributorStatus }) => {
  const isActive = status === 1;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
        isActive 
          ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
          : "border-rose-200 bg-rose-50 text-rose-700"
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
