import type { AppRole } from "../config/auth";

export const canMutateContributions = (role: AppRole | null, activeYear: number, currentBusinessYear: number): boolean => {
  if (!role) {
    return false;
  }

  if (role === "viewer") {
    return false;
  }

  return activeYear === currentBusinessYear;
};

export const getContributionRestrictionMessage = (role: AppRole | null, activeYear: number, currentBusinessYear: number): string | null => {
  if (!role) {
    return "El claim de rol no está disponible en la sesión.";
  }

  if (role === "viewer") {
    return "Modo solo lectura: este usuario no puede crear, editar ni desactivar aportes.";
  }

  if (activeYear !== currentBusinessYear) {
    return `Solo editable en año actual (${currentBusinessYear}).`;
  }

  return null;
};
