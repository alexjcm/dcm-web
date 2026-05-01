import type { Auth0SyncStatus, ContributionState, ContributorStatus } from "../../types/domain";

const stateStyles: Record<ContributionState, string> = {
  pending: "border-neutral-300 bg-neutral-100/90 text-neutral-700 dark:border-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-400",
  incomplete: "border-primary-300 bg-primary-100/70 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400",
  complete: "border-success-300 bg-success-100/70 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400",
  overpaid: "border-success-400 bg-success-200/50 text-success-900 ring-1 ring-success-200/50 dark:border-success-500/40 dark:bg-success-500/20 dark:text-success-300"
};

const stateLabels: Record<ContributionState, string> = {
  pending: "Sin aportes",
  incomplete: "Colaborando",
  complete: "Meta alcanzada",
  overpaid: "Colaborador destacado"
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
          ? "border-success-300 bg-success-100/70 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400" 
          : "border-danger-300 bg-danger-100/70 text-danger-800 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-400"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
};

const auth0StateStyles: Record<Auth0SyncStatus, string> = {
  unknown_legacy:
    "border-neutral-300 bg-neutral-100/90 text-neutral-700 dark:border-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-400",
  not_linked:
    "border-primary-300 bg-primary-100/70 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400",
  pending_password:
    "border-warning-300 bg-warning-100/70 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400",
  linked:
    "border-success-300 bg-success-100/70 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400",
  no_access:
    "border-neutral-400 bg-neutral-200/80 text-neutral-800 dark:border-neutral-500/30 dark:bg-neutral-500/10 dark:text-neutral-300",
  error:
    "border-danger-300 bg-danger-100/70 text-danger-800 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-400"
};

const auth0StateLabels: Record<Auth0SyncStatus, string> = {
  unknown_legacy: "Desconocido",
  not_linked: "Sin cuenta",
  pending_password: "Pendiente",
  linked: "Con cuenta",
  no_access: "Sin permisos",
  error: "Error"
};

export const ContributorAuth0StatusBadge = ({ status }: { status: Auth0SyncStatus }) => {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${auth0StateStyles[status]}`}>
      {auth0StateLabels[status]}
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
