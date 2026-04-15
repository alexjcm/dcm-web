import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  Settings, 
  Users, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldAlert,
  Mail,
  User
} from "lucide-react";

import { ConfirmModal } from "../components/ui/confirm-modal";
import { SectionLoader } from "../components/ui/loaders";
import { APP_PERMISSIONS } from "../config/permissions";
import { ContributorStatusBadge } from "../components/ui/state-badge";
import { useAppContext } from "../context/app-context";
import { useApiClient } from "../hooks/use-api-client";
import { useContributors } from "../hooks/use-contributors";
import { useInvalidateResources } from "../hooks/use-resource-invalidation";
import { useSettings } from "../hooks/use-settings";
import { formatCentsAsInputValue, parseMoneyInputToCents } from "../lib/money";
import { RESOURCE_KEYS } from "../lib/resource-invalidation";
import type { Contributor } from "../types/domain";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/fields";

type ContributorDraft = {
  name: string;
  email: string;
};

const emptyContributorDraft: ContributorDraft = {
  name: "",
  email: ""
};

export const SettingsPage = () => {
  const { permissionsLoaded, hasPermission } = useAppContext();
  const api = useApiClient();
  const invalidateResources = useInvalidateResources();

  const settings = useSettings();
  const contributors = useContributors("all");

  const [amountInput, setAmountInput] = useState<string>("32.00");
  const [savingAmount, setSavingAmount] = useState<boolean>(false);

  const [newContributor, setNewContributor] = useState<ContributorDraft>(emptyContributorDraft);
  const [savingContributor, setSavingContributor] = useState<boolean>(false);

  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [editDraft, setEditDraft] = useState<ContributorDraft>(emptyContributorDraft);

  const [pendingDeactivate, setPendingDeactivate] = useState<Contributor | null>(null);
  const [deactivating, setDeactivating] = useState<boolean>(false);

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
        <p className="mt-2 text-sm text-rose-700 leading-relaxed">
           Esta sección está reservada para administradores. Se requiere el permiso <code className="bg-rose-100 px-1.5 py-0.5 rounded font-bold text-rose-900">{APP_PERMISSIONS.settingsWrite}</code> para realizar cambios en la configuración global.
        </p>
      </Card>
    );
  }

  const saveMonthlyAmount = async () => {
    const amountCents = parseMoneyInputToCents(amountInput);

    if (!amountCents || amountCents < 1) {
      toast.error("El monto mensual debe ser mayor a 0.");
      return;
    }

    setSavingAmount(true);

    const response = await api.put<{ key: string; value: string }>("/api/settings", {
      key: "monthly_amount_cents",
      value: String(amountCents)
    });

    setSavingAmount(false);

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

    toast.success("Contribuidor creado.");
    setNewContributor(emptyContributorDraft);
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

    toast.success("Contribuidor actualizado.");
    setEditingContributor(null);
    invalidateResources(RESOURCE_KEYS.contributors, RESOURCE_KEYS.contributions, RESOURCE_KEYS.summary);
  };

  const deactivateContributor = async () => {
    if (!pendingDeactivate) {
      return;
    }

    setDeactivating(true);

    const response = await api.delete<Contributor>(`/api/contributors/${pendingDeactivate.id}`);

    setDeactivating(false);

    if (!response.ok) {
      toast.error(response.error.detail);
      return;
    }

    toast.success("Contribuidor desactivado.");
    setPendingDeactivate(null);
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
          <p className="text-sm text-slate-500">Configuración avanzada de plataforma y gestión de activos.</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card header={
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-primary-600" />
              Configuración Global
            </div>
          }>
            <div className="space-y-4">
              {settings.loading && !settings.data ? <SectionLoader label="Cargando..." /> : (
                <>
                  <Input
                    label="Monto Base Mensual (USD)"
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                  />
                  <Button
                    icon={Save}
                    onClick={saveMonthlyAmount}
                    isLoading={savingAmount}
                    className="w-full"
                  >
                    Actualizar Monto
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card header={
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-primary-600" />
              Nuevo Contribuidor
            </div>
          }>
            <div className="space-y-4">
              <Input
                label="Nombre Completo"
                value={newContributor.name}
                onChange={(event) => setNewContributor((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Ej. Juan Pérez"
              />
              <Input
                label="Email Principal"
                type="email"
                value={newContributor.email}
                onChange={(event) => setNewContributor((previous) => ({ ...previous, email: event.target.value }))}
                placeholder="juan@ejemplo.com"
              />
              <Button
                variant="secondary"
                icon={Plus}
                onClick={createContributor}
                isLoading={savingContributor}
                className="w-full"
              >
                Registrar
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary-600" />
                Directorio de Contribuidores
              </div>
              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">
                {sortedContributors.length} Registros
              </span>
            </div>
          } bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Identidad</th>
                    <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-slate-600 text-[11px]">Estado</th>
                    <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-slate-600 text-[11px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedContributors.map((contributor) => (
                    <tr key={contributor.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold border border-primary-100 group-hover:bg-primary-100 transition-colors">
                             {contributor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{contributor.name}</div>
                            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                               <Mail size={10} />
                               {contributor.email ?? "Sin correo"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ContributorStatusBadge status={contributor.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            onClick={() => startEditingContributor(contributor)}
                            aria-label="Editar contribuidor"
                          />
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => setPendingDeactivate(contributor)}
                            disabled={contributor.status === 0}
                            aria-label="Desactivar contribuidor"
                          />
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

      <Transition appear show={Boolean(editingContributor)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={savingContributor ? () => undefined : () => setEditingContributor(null)}>
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
                  <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
                        <Edit2 size={20} />
                     </div>
                     <div>
                        <DialogTitle className="text-lg font-extrabold text-slate-900">Editar Perfil</DialogTitle>
                     </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <Input
                      label="Nombre Completo"
                      icon={User}
                      value={editDraft.name}
                      onChange={(event) => setEditDraft((previous) => ({ ...previous, name: event.target.value }))}
                      disabled={savingContributor}
                    />

                    <Input
                      label="Email Principal"
                      icon={Mail}
                      type="email"
                      value={editDraft.email}
                      onChange={(event) => setEditDraft((previous) => ({ ...previous, email: event.target.value }))}
                      disabled={savingContributor}
                    />
                  </div>

                  <div className="bg-slate-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-slate-100">
                    <Button
                      onClick={saveContributorEdit}
                      isLoading={savingContributor}
                      className="sm:min-w-[140px]"
                    >
                      Guardar Cambios
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingContributor(null)}
                      disabled={savingContributor}
                    >
                      Descartar
                    </Button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmModal
        open={Boolean(pendingDeactivate)}
        title="Desactivar contribuidor"
        description={pendingDeactivate ? `Se desactivará a ${pendingDeactivate.name}. No podrá realizar nuevos aportes pero se conserva su historial.` : ""}
        confirmLabel="Desactivar"
        danger
        loading={deactivating}
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={() => {
          void deactivateContributor();
        }}
      />
    </div>
  );
};

