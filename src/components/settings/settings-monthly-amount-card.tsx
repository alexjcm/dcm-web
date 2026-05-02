import { Save, Coins } from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/fields";
import { SectionLoader } from "../ui/loaders";

type SettingsMonthlyAmountCardProps = {
  amountInput: string;
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onAmountChange: (value: string) => void;
  onRequestUpdate: () => void;
};

export const SettingsMonthlyAmountCard = ({
  amountInput,
  loading,
  saving,
  canEdit,
  onAmountChange,
  onRequestUpdate
}: SettingsMonthlyAmountCardProps) => {
  return (
    <Card
      className="w-full border-primary-200 bg-[var(--gradient-surface)] shadow-card dark:border-neutral-700"
      bodyClassName="px-4 py-4 sm:px-6 sm:py-5"
      header={
        <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Coins size={18} className="text-primary-700 dark:text-primary-400" />
          Monto Base Mensual
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <SectionLoader label="Cargando..." />
        ) : (
          <>
            <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Establece el aporte mensual sugerido para los contribuyentes.
            </p>
            {!canEdit ? (
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Solo un superadmin puede modificar esta configuración.
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  prefix="$"
                  value={amountInput}
                  disabled={!canEdit || saving}
                  onChange={(event) => onAmountChange(event.target.value)}
                  className="text-base font-semibold sm:text-sm"
                />
              </div>
              <Button
                icon={Save}
                onClick={onRequestUpdate}
                disabled={!canEdit}
                isLoading={saving}
                className="h-[42px] shrink-0 whitespace-nowrap px-3.5"
              >
                Actualizar Monto
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>

  );
};
