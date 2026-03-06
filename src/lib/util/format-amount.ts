const REGION_TO_CURRENCY: Record<string, string> = {
  AE: "AED",
  AU: "AUD",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  CZ: "CZK",
  DE: "EUR",
  DK: "DKK",
  EG: "EGP",
  ES: "EUR",
  EU: "EUR",
  FR: "EUR",
  GB: "GBP",
  HK: "HKD",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IN: "INR",
  IT: "EUR",
  JP: "JPY",
  KR: "KRW",
  MX: "MXN",
  MY: "MYR",
  NG: "NGN",
  NL: "EUR",
  NO: "NOK",
  NZ: "NZD",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  QA: "QAR",
  RO: "RON",
  RU: "RUB",
  SA: "SAR",
  SE: "SEK",
  SG: "SGD",
  TH: "THB",
  TR: "TRY",
  TW: "TWD",
  US: "USD",
  VN: "VND",
  ZA: "ZAR",
};

function getBrowserLocale() {
  if (typeof window === "undefined") {
    return "en-US";
  }

  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages[0];
  }

  return navigator.language || "en-US";
}

function getRegionFromLocale(locale: string) {
  try {
    const region = new Intl.Locale(locale).maximize().region;
    if (region) return region.toUpperCase();
  } catch {
    // Ignore invalid locale and try regex fallback.
  }

  const match = locale.match(/-([A-Za-z]{2})\b/);
  return match ? match[1].toUpperCase() : undefined;
}

export function inferCurrencyFromLocale(locale?: string) {
  const resolvedLocale = locale || getBrowserLocale();
  const region = getRegionFromLocale(resolvedLocale);

  if (!region) return "USD";
  return REGION_TO_CURRENCY[region] || "USD";
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
  const currency = options.currency || inferCurrencyFromLocale(locale);
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;

  console.log("locale", locale);

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
