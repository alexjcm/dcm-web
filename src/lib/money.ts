const CURRENCY_FORMATTER = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD"
});

export const formatCentsAsCurrency = (amountCents: number): string => {
  return CURRENCY_FORMATTER.format(amountCents / 100);
};

export const formatCentsAsInputValue = (amountCents: number): string => {
  return (amountCents / 100).toFixed(2).replace(".", ",");
};

export const sanitizeMoneyInput = (value: string): string => {
  const normalized = value.replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
  if (!normalized) {
    return "";
  }

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  const separatorIndex = Math.max(lastComma, lastDot);
  const digitsOnly = normalized.replace(/[^\d]/g, "");

  if (separatorIndex < 0) {
    return digitsOnly;
  }

  const digitsAfterLastSeparator = normalized.slice(separatorIndex + 1).replace(/[^\d]/g, "").length;

  // Incomplete decimal typing (e.g. "12," or "12.")
  if (digitsAfterLastSeparator === 0) {
    const wholeDigits = normalized.slice(0, separatorIndex).replace(/[^\d]/g, "");
    return `${wholeDigits || "0"},`;
  }

  // Decimal mode: keep at most 2 decimals, normalize separator to comma.
  if (digitsAfterLastSeparator <= 2) {
    const wholeDigits = normalized.slice(0, separatorIndex).replace(/[^\d]/g, "");
    const decimalDigits = normalized.slice(separatorIndex + 1).replace(/[^\d]/g, "").slice(0, 2);
    return `${wholeDigits || "0"},${decimalDigits}`;
  }

  // Thousands-like input (e.g. "1.234" / "1,234"): keep as integer digits.
  return digitsOnly;
};

export const parseMoneyInputToCents = (value: string): number | null => {
  const normalized = value.trim().replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
  if (!normalized) {
    return null;
  }

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  const separatorIndex = Math.max(lastComma, lastDot);

  let canonical = normalized.replace(/[^\d]/g, "");

  if (separatorIndex >= 0) {
    const wholeDigits = normalized.slice(0, separatorIndex).replace(/[^\d]/g, "");
    const decimalDigits = normalized.slice(separatorIndex + 1).replace(/[^\d]/g, "");

    if (decimalDigits.length === 0) {
      return null;
    }

    if (decimalDigits.length <= 2) {
      canonical = `${wholeDigits || "0"}.${decimalDigits}`;
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(canonical)) {
    return null;
  }

  const [wholePart, decimalPart = ""] = canonical.split(".");
  const paddedDecimals = (decimalPart + "00").slice(0, 2);

  const whole = Number(wholePart);
  const decimals = Number(paddedDecimals);

  if (!Number.isFinite(whole) || !Number.isFinite(decimals)) {
    return null;
  }

  return whole * 100 + decimals;
};
