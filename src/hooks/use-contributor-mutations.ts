import { useState } from "react";
import { toast } from "sonner";

import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contributor } from "../types/domain";
import type { ContributorDraft } from "../types/settings";
import { useApiClient } from "./use-api-client";
import { useInvalidateResources } from "./use-resource-invalidation";

type Auth0SyncFeedback = {
  attempted?: boolean;
  reason?: "auto_sync_disabled" | "no_email";
  status?: "pending_password" | "linked" | "no_access" | "error";
  existing?: boolean;
  email_sent?: boolean;
  detail?: string;
};

type UseContributorMutationsParams = {
  onCreateSuccess: () => void;
  onEditSuccess: () => void;
  onStatusChangeSuccess: () => void;
};

const notifyContributorAuth0Outcome = ({
  actionLabel,
  auth0
}: {
  actionLabel: "creado" | "actualizado" | "activado" | "desactivado";
  auth0?: Auth0SyncFeedback;
}) => {
  const baseSuccess = `Contribuyente ${actionLabel}.`;

  if (!auth0) {
    toast.success(baseSuccess);
    return;
  }

  if (auth0.attempted === false) {
    if (auth0.reason === "auto_sync_disabled") {
      toast.success("Contribuyente guardado. No se sincronizó con Auth0 porque el administrador desactivó la integración.");
      return;
    }

    if (auth0.reason === "no_email") {
      toast.success(`${baseSuccess} No se sincronizó con Auth0 porque no hay correo registrado.`);
      return;
    }
  }

  if (auth0.status === "error") {
    toast.error(`${baseSuccess} Se guardó localmente, pero falló la sincronización con Auth0.`, { duration: 8000 });
    return;
  }

  if (auth0.status === "pending_password" && auth0.email_sent) {
    toast.success(`${baseSuccess} Se creó el acceso y se envió correo; estado actual: Pendiente.`);
    return;
  }

  if (auth0.status === "pending_password" && auth0.existing) {
    toast.success(`${baseSuccess} La cuenta existe pero aún no define contraseña; estado: Pendiente.`);
    return;
  }

  if (auth0.status === "linked" && auth0.existing) {
    toast.success(
      actionLabel === "desactivado"
        ? `${baseSuccess} El acceso quedó restringido a viewer en Auth0.`
        : `${baseSuccess} Vinculado a cuenta existente en Auth0.`
    );
    return;
  }

  if (auth0.status === "no_access" && auth0.existing) {
    toast.success(
      `${baseSuccess} La cuenta existe en Auth0, pero se respetó la ausencia de roles y permisos.`
    );
    return;
  }

  toast.success(baseSuccess);
};

export const useContributorMutations = ({
  onCreateSuccess,
  onEditSuccess,
  onStatusChangeSuccess
}: UseContributorMutationsParams) => {
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const [savingContributor, setSavingContributor] = useState<boolean>(false);
  const [changingStatus, setChangingStatus] = useState<boolean>(false);

  const createContributor = async (draft: ContributorDraft) => {
    if (!draft.name.trim()) {
      toast.error("El nombre es obligatorio.", { duration: 8000 });
      return;
    }

    setSavingContributor(true);

    const response = await api.post<{ contribuyente: Contributor; auth0?: Auth0SyncFeedback }>("/api/contributors", {
      name: draft.name.trim(),
      email: draft.email.trim() ? draft.email.trim() : null
    });

    setSavingContributor(false);

    if (!response.ok) {
      toast.error(response.error.detail, { duration: 8000 });
      return;
    }

    notifyContributorAuth0Outcome({ actionLabel: "creado", auth0: response.data?.auth0 });
    onCreateSuccess();
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const saveContributorEdit = async (contributor: Contributor | null, draft: ContributorDraft) => {
    if (!contributor) {
      return;
    }

    if (!draft.name.trim()) {
      toast.error("El nombre es obligatorio.", { duration: 8000 });
      return;
    }

    setSavingContributor(true);

    const response = await api.put<{ contribuyente: Contributor; auth0?: Auth0SyncFeedback }>(`/api/contributors/${contributor.id}`, {
      name: draft.name.trim(),
      email: draft.email.trim() ? draft.email.trim() : null
    });

    setSavingContributor(false);

    if (!response.ok) {
      toast.error(response.error.detail, { duration: 8000 });
      return;
    }

    notifyContributorAuth0Outcome({ actionLabel: "actualizado", auth0: response.data?.auth0 });
    onEditSuccess();
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const changeContributorStatus = async (contributor: Contributor | null) => {
    if (!contributor) {
      return;
    }

    const nextStatus = contributor.status === 1 ? 0 : 1;
    setChangingStatus(true);

    const response = await api.put<{ contribuyente: Contributor; auth0?: Auth0SyncFeedback }>(`/api/contributors/${contributor.id}`, {
      status: nextStatus
    });

    setChangingStatus(false);

    if (!response.ok) {
      toast.error(response.error.detail, { duration: 8000 });
      return;
    }

    notifyContributorAuth0Outcome({
      actionLabel: nextStatus === 1 ? "activado" : "desactivado",
      auth0: response.data?.auth0
    });
    onStatusChangeSuccess();
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  return {
    savingContributor,
    changingStatus,
    createContributor,
    saveContributorEdit,
    changeContributorStatus
  };
};
