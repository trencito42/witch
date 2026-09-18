import { PLANS, type PlanId } from "@/lib/plans";

export type StripePriceCatalog = {
  freelancer?: string | null;
  agency?: string | null;
  agencyPro?: string | null;
};

export function planFromPriceId(
  priceId: string | null | undefined,
  catalog: StripePriceCatalog,
): PlanId | null {
  if (!priceId) return null;
  if (catalog.freelancer && priceId === catalog.freelancer) return "freelancer";
  if (catalog.agency && priceId === catalog.agency) return "agency";
  if (catalog.agencyPro && priceId === catalog.agencyPro) return "agency_pro";
  return null;
}

export function resolveStripePlan(input: {
  priceId?: string | null;
  metadataPlan?: string | null;
  catalog: StripePriceCatalog;
}): PlanId {
  const fromPrice = planFromPriceId(input.priceId, input.catalog);
  if (fromPrice) return fromPrice;
  const meta = input.metadataPlan;
  if (meta && meta in PLANS && meta !== "free") return meta as PlanId;
  return "free";
}
