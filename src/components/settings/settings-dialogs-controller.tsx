import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";

import { useApiClient } from "../../hooks/use-api-client";
import { useInvalidateResources } from "../../hooks/use-resource-invalidation";
import { formatCentsAsCurrency } from "../../lib/money";
import { RESOURCE_KEYS } from "../../lib/resource-invalidation";
import type { Contributor } from "../../types/domain";
import type { ContributorDraft } from "../../types/settings";
import { emptyContributorDraft } from "../../types/settings";

const ContributorModal = lazy(async () => {
  const module = await import("./contributor-modal");
  return { default: module.ContributorModal };
});

const ConfirmModal = lazy(async () => {
  const module = await import("../ui/confirm-modal");
  return { default: module.ConfirmModal };
});

type SettingsDialogsControllerProps = {
  auth0AutoSyncEnabled: boolean;
  pendingAmountCents: number | null;
  setPendingAmountCents: (value: number | null) => void;
  onSavingAmountChange: (value: boolean) => void;
  onEditContributor: (contributor: Contributor) => void;
  onToggleContributorStatus: (contributor: Contributor) => void;
  onOpenCreateContributor: () => void;
  children: (controls: {
    openCreateContributorModal: () => void;
    startEditingContributor: (contributor: Contributor) => void;
    requestContributorStatusChange: (contributor: Contributor) => void;
    requestAuth0AutoSyncChange: (nextValue: boolean) => void;
    savingAuth0AutoSync: boolean;
    savingAmount: boolean;
  }) => React.ReactNode;
};

export const SettingsDialogsController = ({
  auth0AutoSyncEnabled,
  pendingAmountCents,
  setPendingAmountCents,
  onSavingAmountChange,
  onEditContributor,
  onToggleContributorStatus,
  onOpenCreateContributor,
  children
}: SettingsDialogsControllerProps) => {
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const [newContributor, setNewContributor] = useState<ContributorDraft>(emptyContributorDraft);
  const [isCreateContributorOpen, setIsCreateContributorOpen] = useState<boolean>(false);
  const [savingContributor, setSavingContributor] = useState<boolean>(false);
  const [savingAmount, setSavingAmount] = useState<boolean>(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [editDraft, setEditDraft] = useState<ContributorDraft>(emptyContributorDraft);
  const [pendingStatusChange, setPendingStatusChange] = useState<Contributor | null>(null);
  const [changingStatus, setChangingStatus] = useState<boolean>(false);
  const [pendingAuth0AutoSyncValue, setPendingAuth0AutoSyncValue] = useState<boolean | null>(null);
  const [savingAuth0AutoSync, setSavingAuth0AutoSync] = useState<boolean>(false);

  type Auth0SyncFeedback = {
    attempted?: boolean;
    reason?: "auto_sync_disabled" | "no_email";
    status?: "pending_password" | "linked" | "no_access" | "error";
    existing?: boolean;
    email_sent?: boolean;
    detail?: string;
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
      toast.error(`${baseSuccess} Se guardó localmente, pero falló la sincronización con Auth0.`);
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

  const syncSavingAmount = (value: boolean) => {
    setSavingAmount(value);
    onSavingAmountChange(value);
  };

  const openCreateContributorModal = () => {
    setNewContributor(emptyContributorDraft);
    setIsCreateContributorOpen(true);
    onOpenCreateContributor();
  };

  const closeCreateContributorModal = () => {
    setIsCreateContributorOpen(false);
    setNewContributor(emptyContributorDraft);
  };

  const createContributor = async () => {
    if (!newContributor.name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSavingContributor(true);

    const response = await api.post<{ contribuyente: Contributor; auth0?: Auth0SyncFeedback }>("/api/contributors", {
      name: newContributor.name.trim(),
      email: newContributor.email.trim() ? newContributor.email.trim() : null
    });

    setSavingContributor(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    notifyContributorAuth0Outcome({ actionLabel: "creado", auth0: response.data?.auth0 });

    closeCreateContributorModal();
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const startEditingContributor = (contributor: Contributor) => {
    setEditingContributor(contributor);
    setEditDraft({
      name: contributor.name,
      email: contributor.email ?? ""
    });
    onEditContributor(contributor);
  };

  const closeEditContributorModal = () => {
    setEditingContributor(null);
  };

  const saveContributorEdit = async () => {
    if (!editingContributor) {
      return;
    }

    if (!editDraft.name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSavingContributor(true);

    const response = await api.put<{ contribuyente: Contributor; auth0?: Auth0SyncFeedback }>(`/api/contributors/${editingContributor.id}`, {
      name: editDraft.name.trim(),
      email: editDraft.email.trim() ? editDraft.email.trim() : null
    });

    setSavingContributor(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    notifyContributorAuth0Outcome({ actionLabel: "actualizado", auth0: response.data?.auth0 });

    closeEditContributorModal();
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const requestContributorStatusChange = (contributor: Contributor) => {
    setPendingStatusChange(contributor);
    onToggleContributorStatus(contributor);
  };

  const changeContributorStatus = async () => {
    if (!pendingStatusChange) {
      return;
    }

    const nextStatus = pendingStatusChange.status === 1 ? 0 : 1;
    setChangingStatus(true);

    const response = await api.put<{ contribuyente: Contributor; auth0?: Auth0SyncFeedback }>(`/api/contributors/${pendingStatusChange.id}`, {
      status: nextStatus
    });

    setChangingStatus(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    notifyContributorAuth0Outcome({
      actionLabel: nextStatus === 1 ? "activado" : "desactivado",
      auth0: response.data?.auth0
    });
    setPendingStatusChange(null);
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const requestAuth0AutoSyncChange = (nextValue: boolean) => {
    if (nextValue === auth0AutoSyncEnabled) {
      return;
    }

    if (!auth0AutoSyncEnabled && nextValue) {
      setPendingAuth0AutoSyncValue(true);
      return;
    }

    void saveAuth0AutoSyncSetting(nextValue);
  };

  const saveAuth0AutoSyncSetting = async (nextValue: boolean) => {
    setSavingAuth0AutoSync(true);

    const response = await api.put<{ key: string; value: string }>("/api/settings", {
      key: "auth0_auto_sync_enabled",
      value: nextValue ? "true" : "false"
    });

    setSavingAuth0AutoSync(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    setPendingAuth0AutoSyncValue(null);
    toast.success(nextValue ? "Sincronización automática con Auth0 activada." : "Sincronización automática con Auth0 desactivada.");
    invalidateResources(RESOURCE_KEYS.settings, RESOURCE_KEYS.contributors);
  };

  const saveMonthlyAmount = async () => {
    if (!pendingAmountCents || pendingAmountCents < 1) {
      setPendingAmountCents(null);
      return;
    }

    syncSavingAmount(true);

    const response = await api.put<{ key: string; value: string }>("/api/settings", {
      key: "monthly_amount_cents",
      value: String(pendingAmountCents)
    });

    syncSavingAmount(false);
    setPendingAmountCents(null);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success("Monto mensual actualizado.");
    invalidateResources(RESOURCE_KEYS.settings, RESOURCE_KEYS.summary);
  };

  return (
    <>
      {children({
        openCreateContributorModal,
        startEditingContributor,
        requestContributorStatusChange,
        requestAuth0AutoSyncChange,
        savingAuth0AutoSync,
        savingAmount
      })}

      <Suspense fallback={null}>
        {isCreateContributorOpen ? (
          <ContributorModal
            open
            title="Nuevo Contribuyente"
            submitLabel="Registrar"
            auth0AutoSyncEnabled={auth0AutoSyncEnabled}
            draft={newContributor}
            submitting={savingContributor}
            onClose={closeCreateContributorModal}
            onChange={setNewContributor}
            onSubmit={createContributor}
          />
        ) : null}

        {editingContributor ? (
          <ContributorModal
            open
            title="Editar Contribuyente"
            submitLabel="Guardar cambios"
            auth0AutoSyncEnabled={auth0AutoSyncEnabled}
            draft={editDraft}
            submitting={savingContributor}
            onClose={closeEditContributorModal}
            onChange={setEditDraft}
            onSubmit={saveContributorEdit}
          />
        ) : null}

        {pendingAmountCents !== null ? (
          <ConfirmModal
            open
            title="Confirmar actualización de monto"
            description={`Se actualizará el monto base mensual del sistema a: ${formatCentsAsCurrency(pendingAmountCents)}.`}
            confirmLabel="Actualizar monto"
            compact
            loading={savingAmount}
            onCancel={() => setPendingAmountCents(null)}
            onConfirm={() => {
              void saveMonthlyAmount();
            }}
          />
        ) : null}

        {pendingAuth0AutoSyncValue !== null ? (
          <ConfirmModal
            open
            title={pendingAuth0AutoSyncValue ? "Activar sincronización automática con Auth0" : "Desactivar sincronización automática con Auth0"}
            description={
              pendingAuth0AutoSyncValue
                ? "A partir de ahora, al crear, editar, activar o desactivar contribuyentes, el sistema podrá reconciliar su acceso en Auth0 según la configuración vigente. Esta acción no recorre contribuyentes existentes por lote."
                : "A partir de ahora, los cambios en contribuyentes se guardarán solo en DCM sin sincronización automática con Auth0."
            }
            confirmLabel={pendingAuth0AutoSyncValue ? "Confirmar" : "Desactivar"}
            compact
            loading={savingAuth0AutoSync}
            onCancel={() => setPendingAuth0AutoSyncValue(null)}
            onConfirm={() => {
              void saveAuth0AutoSyncSetting(pendingAuth0AutoSyncValue);
            }}
          />
        ) : null}

        {pendingStatusChange ? (
          <ConfirmModal
            open
            title={pendingStatusChange.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
            description={
              pendingStatusChange.status === 1
                ? `Se desactivará a ${pendingStatusChange.name}. No podrá realizar nuevos aportes, pero se conserva su historial. Si la sincronización automática está activa y existe cuenta en Auth0, su acceso quedará restringido a viewer.`
                : `Se activará nuevamente a ${pendingStatusChange.name}. Volverá a estar disponible para registrar aportes.`
            }
            confirmLabel={pendingStatusChange.status === 1 ? "Desactivar" : "Activar"}
            danger={pendingStatusChange.status === 1}
            compact
            loading={changingStatus}
            onCancel={() => setPendingStatusChange(null)}
            onConfirm={() => {
              void changeContributorStatus();
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
};
