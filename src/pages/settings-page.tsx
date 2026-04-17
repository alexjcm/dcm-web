import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Edit2, Mail, Plus, Save, Settings, ShieldAlert, Trash2, User, Users } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { Input } from "../components/ui/fields";
import { SectionLoader } from "../components/ui/loaders";
import { ContributorStatusBadge } from "../components/ui/state-badge";
import { APP_PERMISSIONS } from "../config/permissions";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributors } from "../hooks/use-contributors";
import { useInvalidateResources } from "../hooks/use-resource-invalidation";
import { useSettings } from "../hooks/use-settings";
import { formatCentsAsInputValue, parseMoneyInputToCents, sanitizeMoneyInput } from "../lib/money";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contributor } from "../types/domain";

type ContributorDraft = {
  name: string;
  email: string;
};

type ContributorModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  draft: ContributorDraft;
  submitting: boolean;
  onClose: () => void;
  onChange: (draft: ContributorDraft) => void;
  onSubmit: () => void;
};

const emptyContributorDraft: ContributorDraft = {
  name: "",
  email: ""
};

const ContributorModal = ({
  open,
  title,
  submitLabel,
  draft,
  submitting,
  onClose,
  onChange,
  onSubmit
}: ContributorModalProps) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={submitting ? () => undefined : onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4 md:p-8">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <DialogPanel className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="border-b border-slate-100 bg-slate-50 px-8 py-6">
                  <DialogTitle className="flex items-center gap-3 text-lg font-extrabold text-slate-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary-600 shadow-sm">
                      <User size={18} />
                    </div>
                    {title}
                  </DialogTitle>
                </div>

                <div className="grid gap-5 p-8">
                  <Input
                    label="Nombre Completo"
                    value={draft.name}
                    onChange={(event) => onChange({ ...draft, name: event.target.value })}
                    placeholder="Ej. Juan Pérez"
                    disabled={submitting}
                  />
                  <Input
                    label="Email Principal"
                    type="email"
                    value={draft.email}
                    onChange={(event) => onChange({ ...draft, email: event.target.value })}
                    placeholder="juan@ejemplo.com"
                    disabled={submitting}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-8 py-6 sm:flex-row-reverse">
                  <Button onClick={onSubmit} isLoading={submitting} className="sm:min-w-[170px]">
                    {submitLabel}
                  </Button>
                  <Button variant="ghost" onClick={onClose} disabled={submitting}>
                    Cancelar
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export const SettingsPage = () => {
  const { permissionsLoaded, hasPermission } = useAppContext();
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

  if (!permissionsLoaded) {
    return <SectionLoader label="Cargando permisos..." />;
  }

  if (!hasPermission(APP_PERMISSIONS.settingsWrite)) {
    return (
      <Card className="border-rose-200 bg-rose-50/30">
        <div className="flex items-center gap-3 text-rose-800">
          <ShieldAlert size={20} />
          <p className="text-sm font-bold uppercase tracking-wider">Acceso Restringido</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-rose-700">
          Esta sección está reservada para administradores. Se requiere el permiso{" "}
          <code className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-900">{APP_PERMISSIONS.settingsWrite}</code> para realizar cambios en la configuración global.
        </p>
      </Card>
    );
  }

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
    setNewContributor(emptyContributorDraft);
    setIsCreateContributorOpen(false);
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const startEditingContributor = (contributor: Contributor) => {
    setEditingContributor(contributor);
    setEditDraft({
      name: contributor.name,
      email: contributor.email ?? ""
    });
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
    setEditingContributor(null);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Panel de Administración</h2>
          <p className="mt-1 text-sm text-slate-500">Configura el monto base y administra la lista de contribuyentes.</p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card
            header={
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-primary-600" />
                Configuración Global
              </div>
            }
          >
            <div className="space-y-4">
              {settings.loading && !settings.data ? (
                <SectionLoader label="Cargando..." />
              ) : (
                <>
                  <Input
                    label="Monto Base Mensual (USD)"
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => setAmountInput(sanitizeMoneyInput(event.target.value))}
                  />
                  <Button
                    icon={Save}
                    onClick={() => {
                      const amountCents = parseMoneyInputToCents(amountInput);

                      if (!amountCents || amountCents < 1) {
                        toast.error("El monto mensual debe ser mayor a 0.");
                        return;
                      }

                      setPendingAmountCents(amountCents);
                    }}
                    isLoading={savingAmount}
                    className="w-full sm:w-auto"
                  >
                    Actualizar Monto
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card
            header={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary-600" />
                  Lista de Contribuyentes
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    {sortedContributors.length} registros
                  </span>
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setNewContributor(emptyContributorDraft);
                      setIsCreateContributorOpen(true);
                    }}
                  >
                    Nuevo contribuyente
                  </Button>
                </div>
              </div>
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Identidad</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Estado</th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedContributors.map((contributor) => (
                    <tr key={contributor.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-3.5">
                        <div>
                          <div className="font-bold leading-tight text-slate-900">{contributor.name}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Mail size={10} />
                            {contributor.email ?? "Sin correo"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <ContributorStatusBadge status={contributor.status} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            onClick={() => startEditingContributor(contributor)}
                            aria-label="Editar contribuyente"
                          />
                          <Button
                            size="sm"
                            variant={contributor.status === 1 ? "danger" : "secondary"}
                            icon={contributor.status === 1 ? Trash2 : Check}
                            onClick={() => setPendingStatusChange(contributor)}
                            aria-label={contributor.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
                          >
                            {contributor.status === 1 ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <ContributorModal
        open={isCreateContributorOpen}
        title="Nuevo Contribuyente"
        submitLabel="Registrar"
        draft={newContributor}
        submitting={savingContributor}
        onClose={() => {
          setIsCreateContributorOpen(false);
          setNewContributor(emptyContributorDraft);
        }}
        onChange={setNewContributor}
        onSubmit={createContributor}
      />

      <ContributorModal
        open={Boolean(editingContributor)}
        title="Editar Contribuyente"
        submitLabel="Guardar cambios"
        draft={editDraft}
        submitting={savingContributor}
        onClose={() => setEditingContributor(null)}
        onChange={setEditDraft}
        onSubmit={saveContributorEdit}
      />

      <ConfirmModal
        open={pendingAmountCents !== null}
        title="Confirmar actualización de monto"
        description={
          pendingAmountCents !== null
            ? `Se actualizará el monto base mensual a ${formatCentsAsInputValue(pendingAmountCents)} USD. Este cambio impactará los cálculos y resúmenes del sistema.`
            : ""
        }
        confirmLabel="Actualizar monto"
        loading={savingAmount}
        onCancel={() => setPendingAmountCents(null)}
        onConfirm={() => {
          void saveMonthlyAmount();
        }}
      />

      <ConfirmModal
        open={Boolean(pendingStatusChange)}
        title={pendingStatusChange?.status === 1 ? "Desactivar contribuyente" : "Activar contribuyente"}
        description={
          pendingStatusChange
            ? pendingStatusChange.status === 1
              ? `Se desactivará a ${pendingStatusChange.name}. No podrá realizar nuevos aportes, pero se conserva su historial.`
              : `Se activará nuevamente a ${pendingStatusChange.name}. Volverá a estar disponible para registrar aportes.`
            : ""
        }
        confirmLabel={pendingStatusChange?.status === 1 ? "Desactivar" : "Activar"}
        danger={pendingStatusChange?.status === 1}
        loading={changingStatus}
        onCancel={() => setPendingStatusChange(null)}
        onConfirm={() => {
          void changeContributorStatus();
        }}
      />
    </div>
  );
};
