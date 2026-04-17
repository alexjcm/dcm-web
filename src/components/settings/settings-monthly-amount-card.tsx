import { Save, Settings } from "lucide-react";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/fields";
import { SectionLoader } from "../ui/loaders";

type SettingsMonthlyAmountCardProps = {
  amountInput: string;
  loading: boolean;
  saving: boolean;
  onAmountChange: (value: string) => void;
  onRequestUpdate: () => void;
};

export const SettingsMonthlyAmountCard = ({
  amountInput,
  loading,
  saving,
  onAmountChange,
  onRequestUpdate
}: SettingsMonthlyAmountCardProps) => {
  return (
    <Card
      className="mx-auto w-full max-w-md xl:mx-0 xl:max-w-none"
      header={
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary-600" />
          Configuración Global
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <SectionLoader label="Cargando..." />
        ) : (
          <>
            <Input
              label="Monto Base Mensual (USD)"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => onAmountChange(event.target.value)}
            />
            <Button icon={Save} onClick={onRequestUpdate} isLoading={saving} className="w-full sm:w-auto">
              Actualizar Monto
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
