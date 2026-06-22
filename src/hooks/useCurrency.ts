import { useSettings } from "./useSettings";

// Full currency symbol map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", AMD: "֏", RUB: "₽",
  AED: "د.إ", AFN: "؋", ALL: "L", AUD: "A$", AZN: "₼",
  BAM: "KM", BDT: "৳", BGN: "лв", BHD: "BD", BRL: "R$",
  BYN: "Br", CAD: "C$", CHF: "Fr", CLP: "$", CNY: "¥",
  COP: "$", CZK: "Kč", DKK: "kr", DZD: "دج", EGP: "£",
  ETB: "Br", GEL: "₾", GHS: "₵", HKD: "HK$", HRK: "kn",
  HUF: "Ft", IDR: "Rp", ILS: "₪", INR: "₹", IQD: "ع.د",
  IRR: "﷼", ISK: "kr", JOD: "JD", JPY: "¥", KES: "KSh",
  KGS: "лв", KRW: "₩", KWD: "KD", KZT: "₸", LBP: "£",
  LKR: "₨", MAD: "MAD", MDL: "L", MKD: "ден", MXN: "$",
  MYR: "RM", NGN: "₦", NOK: "kr", NPR: "₨", NZD: "NZ$",
  OMR: "OMR", PEN: "S/.", PHP: "₱", PKR: "₨", PLN: "zł",
  QAR: "QR", RON: "lei", RSD: "din", SAR: "SR", SEK: "kr",
  SGD: "S$", THB: "฿", TJS: "SM", TMT: "T", TND: "DT",
  TRY: "₺", TWD: "NT$", UAH: "₴", UGX: "USh", UZS: "лв",
  VND: "₫", XAF: "FCFA", XOF: "CFA", ZAR: "R", ZMW: "ZK",
};

// Returns { symbol, code, format }
// format(amount) → e.g. "$ 150" or "֏ 75,000"
export function useCurrency() {
  const { data: settings } = useSettings();
  const code = settings?.currency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[code] ?? code;

  const format = (amount: number | null | undefined, opts?: { compact?: boolean }) => {
    if (amount == null) return "—";
    const formatted = opts?.compact
      ? amount >= 1_000_000
        ? `${(amount / 1_000_000).toFixed(1)}M`
        : amount >= 1_000
        ? `${(amount / 1_000).toFixed(1)}K`
        : amount.toLocaleString()
      : amount.toLocaleString();
    return `${symbol} ${formatted}`;
  };

  return { symbol, code, format };
}
