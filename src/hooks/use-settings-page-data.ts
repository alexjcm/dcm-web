import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useContributors } from "./use-contributors";
import { useSettings } from "./use-settings";
import { formatCentsAsInputValue, parseMoneyInputToCents, sanitizeMoneyInput } from "../lib/money";

export const useSettingsPageData = () => {
  const settings = useSettings();
  const contributors = useContributors("all");

  const [amountInput, setAmountInput] = useState<string>("32,00");
  const [pendingAmountCents, setPendingAmountCents] = useState<number | null>(null);

  useEffect(() => {
    setAmountInput(formatCentsAsInputValue(settings.monthlyAmountCents));
  }, [settings.monthlyAmountCents]);

  const sortedContributors = useMemo(() => contributors.data?.items ?? [], [contributors.data]);

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

  return {
    settings,
    sortedContributors,
    auth0AutoSyncEnabled: settings.auth0AutoSyncEnabled,
    amountInput,
    pendingAmountCents,
    setPendingAmountCents,
    handleAmountInputChange,
    requestMonthlyAmountUpdate
  };
};
