import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { SettingsDialogsController } from "../components/settings/settings-dialogs-controller";
import { SettingsAuth0IntegrationCard } from "../components/settings/settings-auth0-integration-card";
import { SettingsContributorsCard } from "../components/settings/settings-contributors-card";
import { SettingsMonthlyAmountCard } from "../components/settings/settings-monthly-amount-card";
import { Card } from "../components/ui/card";
import { SectionLoader } from "../components/ui/loaders";
import { ScreenHelpButton } from "../components/ui/screen-help-button";
import { APP_PERMISSIONS } from "../config/permissions";
import { useAppContext } from "../context/app-context";
import { useSettingsPageData } from "../hooks/use-settings-page-data";

export const SettingsPage = () => {
  const { permissionsLoaded, hasPermission } = useAppContext();
  const canEditMonthlyAmount = hasPermission(APP_PERMISSIONS.settingsWrite);
  const canViewAuth0Sync = hasPermission(APP_PERMISSIONS.auth0SyncWrite);
  const canEditAuth0Sync = canViewAuth0Sync;
  const canManageContributors = hasPermission(APP_PERMISSIONS.contributorsWrite);
  const {
    settings,
    sortedContributors,
    auth0AutoSyncEnabled,
    amountInput,
    pendingAmountCents,
    setPendingAmountCents,
    handleAmountInputChange,
    requestMonthlyAmountUpdate
  } = useSettingsPageData();

  if (!permissionsLoaded) {
    return <SectionLoader label="Cargando permisos..." />;
  }

  if (!hasPermission(APP_PERMISSIONS.settingsRead)) {
    return (
      <Card className="border-danger-300 bg-danger-100 dark:border-danger-800 dark:bg-danger-900">
        <div className="flex items-center gap-3 text-danger-900 dark:text-danger-50">
          <ShieldAlert size={20} />
          <p className="text-sm font-bold uppercase tracking-wider">Acceso Restringido</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-danger-900 dark:text-danger-200">
          Esta sección requiere el permiso{" "}
          <code className="rounded bg-danger-200 px-1.5 py-0.5 font-bold text-danger-950 dark:bg-danger-800 dark:text-danger-100">{APP_PERMISSIONS.settingsRead}</code> para consultar la configuración disponible.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="-mt-2">
        <div className="flex items-start justify-between gap-2.5">
          <h2 className="min-w-0 flex-1 text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100">
            Panel de Administración
          </h2>
          <ScreenHelpButton
            title="Ajustes"
            description="Actualiza el monto base mensual, administra contribuyentes y controla la sincronización con el sistema de autenticación Auth0."
            className="shrink-0"
          />
        </div>
      </header>


      <SettingsDialogsController
        auth0AutoSyncEnabled={auth0AutoSyncEnabled}
        canViewAuth0Sync={canViewAuth0Sync}
        pendingAmountCents={pendingAmountCents}
        setPendingAmountCents={setPendingAmountCents}
      >
        {({
          openCreateContributorModal,
          requestContributorStatusChange,
          requestAuth0AutoSyncChange,
          savingAuth0AutoSync,
          savingAmount,
          startEditingContributor
        }) => (
          <div className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6 xl:max-w-[380px]">
              <SettingsMonthlyAmountCard
                amountInput={amountInput}
                loading={settings.loading && !settings.data}
                saving={savingAmount}
                canEdit={canEditMonthlyAmount}
                onAmountChange={handleAmountInputChange}
                onRequestUpdate={requestMonthlyAmountUpdate}
              />
              {canViewAuth0Sync ? (
                <SettingsAuth0IntegrationCard
                  enabled={auth0AutoSyncEnabled}
                  saving={savingAuth0AutoSync}
                  canEdit={canEditAuth0Sync}
                  onRequestToggle={requestAuth0AutoSyncChange}
                  onBlockedToggleAttempt={() => {
                    toast.info("Solo un superadmin puede modificar la sincronización automática con Auth0.");
                  }}
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <SettingsContributorsCard
                contributors={sortedContributors}
                canEdit={canManageContributors}
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
