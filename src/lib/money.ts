const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const formatCentsAsCurrency = (amountCents: number): string => {
  return CURRENCY_FORMATTER.format(amountCents / 100);
};

export const formatCentsAsInputValue = (amountCents: number): string => {
  return (amountCents / 100).toFixed(2);
};

export const sanitizeMoneyInput = (value: string): string => {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [wholePart = "", ...decimalParts] = normalized.split(".");
  const decimalPart = decimalParts.join("").slice(0, 2);

  if (normalized.includes(".")) {
    return decimalPart.length > 0 ? `${wholePart}.${decimalPart}` : `${wholePart}.`;
  }

  return wholePart;
};

export const parseMoneyInputToCents = (value: string): number | null => {
  const normalized = value.trim().replace(/,/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = normalized.split(".");
  const paddedDecimals = (decimalPart + "00").slice(0, 2);

  const whole = Number(wholePart);
  const decimals = Number(paddedDecimals);

  if (!Number.isFinite(whole) || !Number.isFinite(decimals)) {
    return null;
  }

  return whole * 100 + decimals;
};
