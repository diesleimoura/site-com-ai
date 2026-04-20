export type PlanKey = "free" | "pro" | "agencia";

export const PLAN_LIMITS: Record<PlanKey, { sites: number; searches: number }> = {
  free: { sites: 2, searches: 1 },
  pro: { sites: 80, searches: 10 },
  agencia: { sites: Infinity, searches: Infinity },
};

export function getPlanLimits(plan: string | null | undefined) {
  const key = (plan ?? "free") as PlanKey;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.free;
}

export function planLabel(plan: string | null | undefined) {
  const map: Record<string, string> = { free: "Grátis", pro: "Pro", agencia: "Agência" };
  return map[plan ?? "free"] ?? "Grátis";
}
