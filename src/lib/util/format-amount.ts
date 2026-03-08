function getBrowserLocale() {
  if (typeof window === "undefined") {
    return "en-US";
  }

  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages[0];
  }

  return navigator.language || "en-US";
}

type FormatAmountOptions = {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatAmount(
  amount: number | string,
  options: FormatAmountOptions = {},
) {
  const numericAmount =
    typeof amount === "number" ? amount : Number.parseFloat(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;

  const locale = options.locale || getBrowserLocale();
  const currency = options.currency || "USD";
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safeAmount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safeAmount);
  }
}
