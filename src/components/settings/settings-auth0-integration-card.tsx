import { ShieldCheck } from "lucide-react";

import { Card } from "../ui/card";

type SettingsAuth0IntegrationCardProps = {
  enabled: boolean;
  saving: boolean;
  canEdit: boolean;
  onRequestToggle: (nextValue: boolean) => void;
  onBlockedToggleAttempt: () => void;
};

export const SettingsAuth0IntegrationCard = ({
  enabled,
  saving,
  canEdit,
  onRequestToggle,
  onBlockedToggleAttempt
}: SettingsAuth0IntegrationCardProps) => {
  const disabled = saving;
  const visuallyDisabled = saving || !canEdit;

  return (
    <Card
      className="w-full border-primary-200 bg-[var(--gradient-surface)] shadow-card dark:border-neutral-700"
      bodyClassName="px-4 py-4 sm:px-6 sm:py-5"
      header={
        <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <ShieldCheck size={18} className="text-primary-700 dark:text-primary-400" />
          Integración Auth0
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Controla si el sistema sincroniza automáticamente cuentas de contribuyentes con Auth0 al crear, editar o activar.
        </p>

        <div className="rounded-xl border border-border bg-white/80 p-3.5 dark:bg-neutral-900/30">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Sincronización automática con Auth0</p>
              {!canEdit ? (
                <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Solo un superadmin puede modificar esta configuración.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-disabled={visuallyDisabled}
              aria-label="Sincronización automática con Auth0"
              disabled={disabled}
              onClick={() => {
                if (!canEdit) {
                  onBlockedToggleAttempt();
                  return;
                }

                onRequestToggle(!enabled);
              }}
              className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                enabled
                  ? "border-success-600 bg-success-600 dark:border-success-500 dark:bg-success-500"
                  : "border-neutral-300 bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-700"
              } ${visuallyDisabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
