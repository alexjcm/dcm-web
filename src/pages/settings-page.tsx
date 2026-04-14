import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900">
        Esta sección está restringida a usuarios con permiso <code>{APP_PERMISSIONS.settingsWrite}</code>.
      </section>
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
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Ajustes (superadmin)</h2>
        <p className="text-sm text-slate-600">Configura el monto base mensual y administra contribuidores.</p>
      </header>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Monto base mensual</h3>
        {settings.loading && !settings.data ? <SectionLoader label="Cargando configuración..." /> : null}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Monto (USD)</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              void saveMonthlyAmount();
            }}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
            disabled={savingAmount}
          >
            {savingAmount ? "Guardando..." : "Guardar monto"}
          </button>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Contribuidores</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              value={newContributor.name}
              onChange={(event) => setNewContributor((previous) => ({ ...previous, name: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-1">
            <span className="font-medium text-slate-700">Email (opcional)</span>
            <input
              type="email"
              value={newContributor.email}
              onChange={(event) => setNewContributor((previous) => ({ ...previous, email: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="sm:col-span-1 sm:self-end">
            <button
              type="button"
              onClick={() => {
                void createContributor();
              }}
              className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
              disabled={savingContributor}
            >
              {savingContributor ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedContributors.map((contributor) => (
                <tr key={contributor.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{contributor.name}</td>
                  <td className="px-4 py-3 text-slate-700">{contributor.email ?? "-"}</td>
                  <td className="px-4 py-3">
                    <ContributorStatusBadge status={contributor.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => startEditingContributor(contributor)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        onClick={() => setPendingDeactivate(contributor)}
                        disabled={contributor.status === 0}
                      >
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <Transition appear show={Boolean(editingContributor)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={savingContributor ? () => undefined : () => setEditingContributor(null)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                  <DialogTitle className="text-lg font-semibold text-slate-900">Editar contribuidor</DialogTitle>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Nombre</span>
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(event) => setEditDraft((previous) => ({ ...previous, name: event.target.value }))}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        disabled={savingContributor}
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Email (opcional)</span>
                      <input
                        type="email"
                        value={editDraft.email}
                        onChange={(event) => setEditDraft((previous) => ({ ...previous, email: event.target.value }))}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                        disabled={savingContributor}
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      onClick={() => setEditingContributor(null)}
                      disabled={savingContributor}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                      onClick={() => {
                        void saveContributorEdit();
                      }}
                      disabled={savingContributor}
                    >
                      {savingContributor ? "Guardando..." : "Guardar cambios"}
                    </button>
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
        description={pendingDeactivate ? `Se desactivará a ${pendingDeactivate.name}.` : ""}
        confirmLabel="Desactivar"
        danger
        loading={deactivating}
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={() => {
          void deactivateContributor();
        }}
      />
    </section>
  );
};
