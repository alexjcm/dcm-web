export const canMutateContributions = (
  hasContributionWritePermission: boolean,
  activeYear: number,
  currentBusinessYear: number
): boolean => {
  return hasContributionWritePermission && activeYear === currentBusinessYear;
};

type RestrictionMessageParams = {
  isSignedIn: boolean;
  permissionsLoaded: boolean;
  hasContributionWritePermission: boolean;
  activeYear: number;
  currentBusinessYear: number;
};

export const getContributionRestrictionMessage = ({
  isSignedIn,
  permissionsLoaded,
  hasContributionWritePermission,
  activeYear,
  currentBusinessYear
}: RestrictionMessageParams): string | null => {
  if (!isSignedIn) {
    return "Se requiere sesión autenticada.";
  }

  if (!permissionsLoaded) {
    return null;
  }

  if (!hasContributionWritePermission) {
    return "No tienes permiso para crear, editar ni desactivar aportes.";
  }

  if (activeYear !== currentBusinessYear) {
    return `Solo editable en año actual (${currentBusinessYear}).`;
  }

  return null;
};
