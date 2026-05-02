import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";

import { useApiClient } from "../../hooks/use-api-client";
import { useContributorMutations } from "../../hooks/use-contributor-mutations";
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
  canViewAuth0Sync: boolean;
  pendingAmountCents: number | null;
  setPendingAmountCents: (value: number | null) => void;
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
  canViewAuth0Sync,
  pendingAmountCents,
  setPendingAmountCents,
  children
}: SettingsDialogsControllerProps) => {
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const [newContributor, setNewContributor] = useState<ContributorDraft>(emptyContributorDraft);
  const [isCreateContributorOpen, setIsCreateContributorOpen] = useState<boolean>(false);
  const [savingAmount, setSavingAmount] = useState<boolean>(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [editDraft, setEditDraft] = useState<ContributorDraft>(emptyContributorDraft);
  const [pendingStatusChange, setPendingStatusChange] = useState<Contributor | null>(null);
  const [pendingAuth0AutoSyncValue, setPendingAuth0AutoSyncValue] = useState<boolean | null>(null);
  const [savingAuth0AutoSync, setSavingAuth0AutoSync] = useState<boolean>(false);

  const syncSavingAmount = (value: boolean) => {
    setSavingAmount(value);
  };

  const openCreateContributorModal = () => {
    setNewContributor(emptyContributorDraft);
    setIsCreateContributorOpen(true);
  };

  const closeCreateContributorModal = () => {
    setIsCreateContributorOpen(false);
    setNewContributor(emptyContributorDraft);
  };

  const startEditingContributor = (contributor: Contributor) => {
    setEditingContributor(contributor);
    setEditDraft({
      name: contributor.name,
      email: contributor.email ?? ""
    });
  };

  const closeEditContributorModal = () => {
    setEditingContributor(null);
  };

  const requestContributorStatusChange = (contributor: Contributor) => {
    setPendingStatusChange(contributor);
  };

  const { savingContributor, changingStatus, createContributor, saveContributorEdit, changeContributorStatus } =
    useContributorMutations({
      onCreateSuccess: closeCreateContributorModal,
      onEditSuccess: closeEditContributorModal,
      onStatusChangeSuccess: () => {
        setPendingStatusChange(null);
      }
    });

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
      toast.error(response.error.detail, { duration: 8000 });
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
      toast.error(response.error.detail, { duration: 8000 });
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
            draft={newContributor}
            submitting={savingContributor}
            onClose={closeCreateContributorModal}
            onChange={setNewContributor}
            onSubmit={() => createContributor(newContributor)}
          />
        ) : null}

        {editingContributor ? (
          <ContributorModal
            open
            title="Editar Contribuyente"
            submitLabel="Guardar cambios"
            draft={editDraft}
            submitting={savingContributor}
            onClose={closeEditContributorModal}
            onChange={setEditDraft}
            onSubmit={() => saveContributorEdit(editingContributor, editDraft)}
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
                ? canViewAuth0Sync
                  ? auth0AutoSyncEnabled
                    ? `Se desactivará a ${pendingStatusChange.name}. No podrá realizar nuevos aportes, pero se conserva su historial. Si existe cuenta en Auth0, su acceso quedará restringido a viewer.`
                    : `Se desactivará a ${pendingStatusChange.name}. No podrá realizar nuevos aportes, pero se conserva su historial. Los cambios de acceso en Auth0 no se sincronizarán automáticamente mientras esa opción esté desactivada.`
                  : `Se desactivará a ${pendingStatusChange.name}. No podrá realizar nuevos aportes, pero se conserva su historial. Si existe integración con Auth0, el acceso se reconciliará según la configuración definida por el superadmin.`
                : `Se activará nuevamente a ${pendingStatusChange.name}. Volverá a estar disponible para registrar aportes.`
            }
            confirmLabel={pendingStatusChange.status === 1 ? "Desactivar" : "Activar"}
            danger={pendingStatusChange.status === 1}
            compact
            loading={changingStatus}
            onCancel={() => setPendingStatusChange(null)}
            onConfirm={() => {
              void changeContributorStatus(pendingStatusChange);
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
};
