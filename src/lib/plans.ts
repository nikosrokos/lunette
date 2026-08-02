import type { PlanId, PlanDefinition } from "./types";

export const FREE_PRODUCT_LIMIT = 6;

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "€0",
    productLimit: FREE_PRODUCT_LIMIT,
    features: [
      "Public studio page",
      "Contact from buyers",
      `Up to ${FREE_PRODUCT_LIMIT} products`,
      "Basic listing in Discover",
    ],
    missing: [
      "Unlimited products",
      "Fit Match boost",
      "Featured promote slots",
      "Priority in local results",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "€29/mo",
    productLimit: null,
    features: [
      "Everything in Free",
      "Unlimited products",
      "Fit Match boost",
      "Featured promote slots",
      "Priority in local results",
      "Seller analytics (soon)",
    ],
    missing: [],
  },
};

export function productLimitForPlan(plan: PlanId): number | null {
  return PLANS[plan].productLimit;
}

export function canUploadMore(plan: PlanId, currentCount: number): boolean {
  const limit = productLimitForPlan(plan);
  if (limit === null) return true;
  return currentCount < limit;
}

export function canUseFitMatchBoost(plan: PlanId): boolean {
  return plan === "pro";
}

export function canFeaturePromote(plan: PlanId): boolean {
  return plan === "pro";
}
