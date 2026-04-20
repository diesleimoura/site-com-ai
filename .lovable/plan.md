
## Plan: Plan-based feature gating

Block free-tier users from creating sites past their monthly limit and show an upgrade modal pointing to `/turbo`.

### Limits per plan
- **free**: 2 sites/month, 1 prospect search/month
- **pro**: 80 sites/month, 10 searches/month
- **agencia**: unlimited

### Changes

**1. New helper `src/lib/plan-limits.ts`** (client-safe constants)
```ts
export const PLAN_LIMITS = {
  free: { sites: 2, searches: 1 },
  pro: { sites: 80, searches: 10 },
  agencia: { sites: Infinity, searches: Infinity },
};
export function getPlanLimits(plan: string) { ... }
```

**2. New component `src/components/UpgradeModal.tsx`**
- Reusable Dialog with title "Limite do plano atingido"
- Shows current usage (X/Y sites used)
- Two CTAs: "Ver planos" → navigates to `/turbo`, "Fechar"
- Props: `open`, `onOpenChange`, `resource: "sites" | "searches"`, `used`, `limit`

**3. Server-side enforcement in `src/server/sites.functions.ts`**
- In `generateSiteFn` (or wherever site creation/generation happens): before insert, fetch profile's `plan` + `sites_created_this_month`, throw clear error `"PLAN_LIMIT_SITES"` if exceeded
- After successful generation, increment `sites_created_this_month`
- Same pattern in `prospect.functions.ts` `prospectSearchFn` for `searches_used_this_month` → throw `"PLAN_LIMIT_SEARCHES"`

**4. Client integration in `src/components/dashboard/ProspectSearch.tsx`**
- Fetch profile (plan + counters) via `useQuery`
- Catch `PLAN_LIMIT_SITES` / `PLAN_LIMIT_SEARCHES` errors from server fns → open `<UpgradeModal>` instead of toast
- Wire modal CTA to `navigate({ to: "/turbo" })`

**5. Apply same gating in `src/routes/dashboard.sites.tsx`** if it has a manual "Create site" button (check & wire same modal).

### Out of scope
- Monthly counter reset (cron/scheduled function) — note for later
- Real plan upgrades (still toast "em breve" on /turbo)
- Editing the migrations to add new columns (counters already exist)

### Technical notes
- Counter increment should be atomic; use `supabaseAdmin.rpc` if needed, otherwise a simple `update profiles set sites_created_this_month = sites_created_this_month + 1`
- Server fn errors propagate as `Error` → check `err.message.includes("PLAN_LIMIT_")` on client
