import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useApiClient } from "./use-api-client";
import { useContributors } from "./use-contributors";
import { useInvalidateResources } from "./use-resource-invalidation";
import { useSettings } from "./use-settings";
import { formatCentsAsInputValue, parseMoneyInputToCents, sanitizeMoneyInput } from "../lib/money";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contributor } from "../types/domain";
import type { ContributorDraft } from "../components/settings/contributor-modal";
import { emptyContributorDraft } from "../components/settings/contributor-modal";

export const useSettingsPageState = () => {
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();
  const settings = useSettings();
  const contributors = useContributors("all");

  const [amountInput, setAmountInput] = useState<string>("32.00");
  const [pendingAmountCents, setPendingAmountCents] = useState<number | null>(null);
  const [savingAmount, setSavingAmount] = useState<boolean>(false);
  const [newContributor, setNewContributor] = useState<ContributorDraft>(emptyContributorDraft);
  const [isCreateContributorOpen, setIsCreateContributorOpen] = useState<boolean>(false);
  const [savingContributor, setSavingContributor] = useState<boolean>(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [editDraft, setEditDraft] = useState<ContributorDraft>(emptyContributorDraft);
  const [pendingStatusChange, setPendingStatusChange] = useState<Contributor | null>(null);
  const [changingStatus, setChangingStatus] = useState<boolean>(false);

  useEffect(() => {
    setAmountInput(formatCentsAsInputValue(settings.monthlyAmountCents));
  }, [settings.monthlyAmountCents]);

  const sortedContributors = useMemo(() => {
    return [...(contributors.data?.items ?? [])].sort((left, right) => left.name.localeCompare(right.name, "es"));
  }, [contributors.data]);

  const handleAmountInputChange = (value: string) => {
    setAmountInput(sanitizeMoneyInput(value));
  };

  const requestMonthlyAmountUpdate = () => {
    const amountCents = parseMoneyInputToCents(amountInput);

    if (!amountCents || amountCents < 1) {
      toast.error("El monto mensual debe ser mayor a 0.");
      return;
    }

    setPendingAmountCents(amountCents);
  };

  const saveMonthlyAmount = async () => {
    if (!pendingAmountCents || pendingAmountCents < 1) {
      setPendingAmountCents(null);
      return;
    }

    setSavingAmount(true);

    const response = await api.put<{ key: string; value: string }>("/api/settings", {
      key: "monthly_amount_cents",
      value: String(pendingAmountCents)
    });

    setSavingAmount(false);
    setPendingAmountCents(null);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success("Monto mensual actualizado.");
    invalidateResources(RESOURCE_KEYS.settings, RESOURCE_KEYS.summary);
  };

  const openCreateContributorModal = () => {
    setNewContributor(emptyContributorDraft);
    setIsCreateContributorOpen(true);
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

  return {
    settings,
    sortedContributors,
    amountInput,
    pendingAmountCents,
    savingAmount,
    newContributor,
    isCreateContributorOpen,
    savingContributor,
    editingContributor,
    editDraft,
    pendingStatusChange,
    changingStatus,
    setPendingAmountCents,
    setNewContributor,
    setEditDraft,
    setPendingStatusChange,
    handleAmountInputChange,
    requestMonthlyAmountUpdate,
    saveMonthlyAmount,
    openCreateContributorModal,
    closeCreateContributorModal,
    createContributor,
    startEditingContributor,
    closeEditContributorModal,
    saveContributorEdit,
    changeContributorStatus
  };
};
