// Money helpers. Amounts are stored as euro cents (Int, always positive).

export const CURRENCY = "EUR";
export const CURRENCY_SYMBOL = "€";

// Format cents → "€1,234.56" style string.
export function formatCents(cents: number): string {
  const v = (cents / 100).toLocaleString("en-IE", {
    style: "currency",
    currency: CURRENCY,
  });
  return v;
}

// Format a signed balance (cents) with explicit sign.
export function formatBalance(cents: number): string {
  const abs = formatCents(Math.abs(cents));
  return cents < 0 ? `-${abs}` : abs;
}

// Parse a user-typed amount string ("12.5", "12,50", "12") → cents (Int).
// Returns null when not a valid positive number.
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return cents;
}
