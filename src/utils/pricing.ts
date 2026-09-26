// What /pricing works out from PRICING_TIERS (#141): the prices to show,
// the self-serve plans, and the cheapest plan for a volume. Everything
// comes from the tiers' data; no amount is written here.
import type { PricingTier } from "../types.ts";
import { count } from "./format.ts";

export type BillingPeriod = "monthly" | "yearly";

// "€29", or "€0": whole euros, cents only when an amount has them.
export const formatEur = (amount: number): string =>
  `€${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// The tier's amount for a period, when it has been released.
export const tierAmount = (
  tier: PricingTier,
  period: BillingPeriod,
): number | undefined =>
  period === "monthly" ? tier.monthlyPriceEur : tier.yearlyPriceEur;

// What the price slot says: the amount once it's set, else the tier's word
// ("Upcoming" while withheld, "Custom" for Enterprise).
export const priceLabel = (
  tier: PricingTier,
  period: BillingPeriod = "monthly",
): string => {
  const amount = tierAmount(tier, period);
  return amount === undefined ? tier.price : formatEur(amount);
};

// The plans you can take yourself: the ones with a monthly quota, from the
// smallest quota up.
export const selfServeTiers = (tiers: PricingTier[]): PricingTier[] =>
  tiers
    .filter((tier) => tier.monthlyQuota !== undefined)
    .sort((a, b) => a.monthlyQuota! - b.monthlyQuota!);

// The cheapest self-serve plan whose quota covers `volume`, or undefined
// above the largest quota (then it's Enterprise). While any covering plan's
// price is withheld, prices can't be compared, so the smallest quota wins:
// a bigger plan never costs less.
export function cheapestPlanFor(
  tiers: PricingTier[],
  volume: number,
  period: BillingPeriod = "monthly",
): PricingTier | undefined {
  const covering = selfServeTiers(tiers).filter(
    (tier) => tier.monthlyQuota! >= volume,
  );
  if (covering.every((tier) => tierAmount(tier, period) !== undefined)) {
    // Stable sort: equal prices keep the smaller quota first.
    return [...covering].sort(
      (a, b) => tierAmount(a, period)! - tierAmount(b, period)!,
    )[0];
  }
  return covering[0];
}

// The slider's stops: 1, 2.5 and 5 of each power of ten from 100, plus
// every quota, up to five times the largest quota, so the top of the scale
// shows what lies beyond self-serve.
export function volumeStops(tiers: PricingTier[]): number[] {
  const quotas = selfServeTiers(tiers).map((tier) => tier.monthlyQuota!);
  const top = Math.max(...quotas) * 5;
  const stops = new Set(quotas);
  for (let power = 100; power <= top; power *= 10) {
    for (const step of [1, 2.5, 5]) {
      if (power * step <= top) stops.add(power * step);
    }
  }
  return [...stops].sort((a, b) => a - b);
}

export const volumeText = (volume: number): string =>
  `${count(volume)} Thumbnails a month`;
