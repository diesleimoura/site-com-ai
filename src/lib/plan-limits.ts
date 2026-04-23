export type PlanKey = "free" | "pro" | "agency";

export const PLAN_LIMITS: Record<PlanKey, { sites: number; searches: number }> = {
  free: { sites: 2, searches: 1 },
  pro: { sites: 80, searches: 10 },
  agency: { sites: Infinity, searches: Infinity },
};

export function getPlanLimits(plan: string | null | undefined) {
  const key = (plan ?? "free") as PlanKey;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.free;
}

export function planLabel(plan: string | null | undefined) {
  const map: Record<string, string> = { free: "Grátis", pro: "Pro", agency: "Agência" };
  return map[plan ?? "free"] ?? "Grátis";
}
