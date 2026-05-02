import { useState } from "react";
import { toast } from "sonner";

import type { ContributionPayload } from "../components/contributions/contribution-modal";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contribution, ContributorMeta } from "../types/domain";
import { useApiClient } from "./use-api-client";
import { useInvalidateResources } from "./use-resource-invalidation";

type SelectedCell = {
  contributor: ContributorMeta;
  month: number;
  existingContribution: Contribution | null;
};

type PendingDelete = {
  contribution: Contribution;
  contributorName: string;
};

type UseContributionsPageActionsParams = {
  canMutateCurrentPeriod: boolean;
  contributionRestrictionMessage: string | null;
  contributionMap: Map<string, Contribution>;
  getCellKey: (contributorId: number, month: number) => string;
};

export const useContributionsPageActions = ({
  canMutateCurrentPeriod,
  contributionRestrictionMessage,
  contributionMap,
  getCellKey
}: UseContributionsPageActionsParams) => {
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openGlobalModal = () => {
    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No tienes permisos para editar este período.");
      return;
    }

    setIsGlobalModalOpen(true);
  };

  const openModalForCell = (contributor: ContributorMeta, month: number) => {
    const existingContribution = contributionMap.get(getCellKey(contributor.contributorId, month)) ?? null;

    if (!canMutateCurrentPeriod) {
      toast.info(contributionRestrictionMessage ?? "No tienes permisos para editar este período.");
      return;
    }

    if (contributor.status === 0) {
      toast.info("Contribuyente inactivo: no se pueden registrar ni editar aportes.");
      return;
    }

    setSelectedCell({ contributor, month, existingContribution });
  };

  const closeContributionModal = () => {
    setSelectedCell(null);
    setIsGlobalModalOpen(false);
  };

  const requestDeleteSelectedContribution = () => {
    if (!selectedCell?.existingContribution) {
      return;
    }

    setPendingDelete({
      contribution: selectedCell.existingContribution,
      contributorName: selectedCell.contributor.name
    });
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  const handleSave = async (payload: ContributionPayload) => {
    setSubmitting(true);

    const isEdit = selectedCell?.existingContribution;
    const response = isEdit
      ? await api.put<Contribution>(`/api/contributions/${selectedCell.existingContribution!.id}`, payload)
      : await api.post<Contribution>("/api/contributions", payload);

    setSubmitting(false);

    if (!response.ok) {
      toast.error(response.error.detail, { duration: 8000 });
      return;
    }

    toast.success(isEdit ? "Aporte actualizado." : "Aporte registrado.");
    closeContributionModal();
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    const response = await api.delete<Contribution>(`/api/contributions/${pendingDelete.contribution.id}`);
    setDeleting(false);

    if (!response.ok) {
      toast.error(response.error.detail, { duration: 8000 });
      return;
    }

    toast.success("Aporte eliminado.", { duration: 6500 });
    setPendingDelete(null);
    setSelectedCell(null);
    invalidateResources(RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  return {
    selectedCell,
    isGlobalModalOpen,
    submitting,
    pendingDelete,
    deleting,
    openGlobalModal,
    openModalForCell,
    closeContributionModal,
    requestDeleteSelectedContribution,
    cancelDelete,
    handleSave,
    handleDelete
  };
};
