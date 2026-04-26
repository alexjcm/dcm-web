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
    savingAmount: boolean;
  }) => React.ReactNode;
};

export const SettingsDialogsController = ({
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

    const response = await api.post<Contributor>("/api/contributors", {
      name: newContributor.name.trim(),
      email: newContributor.email.trim() ? newContributor.email.trim() : null
    });

    setSavingContributor(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success("Contribuyente creado.");
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

    const response = await api.put<Contributor>(`/api/contributors/${editingContributor.id}`, {
      name: editDraft.name.trim(),
      email: editDraft.email.trim() ? editDraft.email.trim() : null
    });

    setSavingContributor(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success("Contribuyente actualizado.");
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

    const response = await api.put<Contributor>(`/api/contributors/${pendingStatusChange.id}`, {
      status: nextStatus
    });

    setChangingStatus(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success(nextStatus === 1 ? "Contribuyente activado." : "Contribuyente desactivado.");
    setPendingStatusChange(null);
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
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
            onSubmit={createContributor}
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

        {pendingStatusChange ? (
          <ConfirmModal
            open
            title={pendingStatusChange.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
            description={
              pendingStatusChange.status === 1
                ? `Se desactivará a ${pendingStatusChange.name}. No podrá realizar nuevos aportes, pero se conserva su historial.`
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
