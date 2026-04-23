import { ShieldAlert } from "lucide-react";

import { SettingsDialogsController } from "../components/settings/settings-dialogs-controller";
import { SettingsContributorsCard } from "../components/settings/settings-contributors-card";
import { SettingsMonthlyAmountCard } from "../components/settings/settings-monthly-amount-card";
import { Card } from "../components/ui/card";
import { SectionLoader } from "../components/ui/loaders";
import { APP_PERMISSIONS } from "../config/permissions";
import { useAppContext } from "../context/app-context";
import { useSettingsPageData } from "../hooks/use-settings-page-data";

export const SettingsPage = () => {
  const { permissionsLoaded, hasPermission } = useAppContext();
  const {
    settings,
    sortedContributors,
    amountInput,
    pendingAmountCents,
    setPendingAmountCents,
    handleAmountInputChange,
    requestMonthlyAmountUpdate
  } = useSettingsPageData();

  if (!permissionsLoaded) {
    return <SectionLoader label="Cargando permisos..." />;
  }

  if (!hasPermission(APP_PERMISSIONS.settingsWrite)) {
    return (
      <Card className="border-danger-300 bg-danger-100 dark:border-danger-800 dark:bg-danger-900">
        <div className="flex items-center gap-3 text-danger-900 dark:text-danger-50">
          <ShieldAlert size={20} />
          <p className="text-sm font-bold uppercase tracking-wider">Acceso Restringido</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-danger-900 dark:text-danger-200">
          Esta sección está reservada para administradores. Se requiere el permiso{" "}
          <code className="rounded bg-danger-200 px-1.5 py-0.5 font-bold text-danger-950 dark:bg-danger-800 dark:text-danger-100">{APP_PERMISSIONS.settingsWrite}</code> para realizar cambios en la configuración global.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">Panel de Administración</h2>
          </div>
        </div>
      </header>


      <SettingsDialogsController
        pendingAmountCents={pendingAmountCents}
        setPendingAmountCents={setPendingAmountCents}
        onSavingAmountChange={() => undefined}
        onEditContributor={() => undefined}
        onToggleContributorStatus={() => undefined}
        onOpenCreateContributor={() => undefined}
      >
        {({ openCreateContributorModal, requestContributorStatusChange, savingAmount, startEditingContributor }) => (
          <div className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6 xl:max-w-[380px]">
              <SettingsMonthlyAmountCard
                amountInput={amountInput}
                loading={settings.loading && !settings.data}
                saving={savingAmount}
                onAmountChange={handleAmountInputChange}
                onRequestUpdate={requestMonthlyAmountUpdate}
              />
            </div>

            <div className="min-w-0">
              <SettingsContributorsCard
                contributors={sortedContributors}
                onCreateContributor={openCreateContributorModal}
                onEditContributor={startEditingContributor}
                onToggleContributorStatus={requestContributorStatusChange}
              />
            </div>
          </div>
        )}
      </SettingsDialogsController>
    </div>
  );
};
