

## Live progress bar + step list during site generation

The progress page (`/sites/$id/gerando`) already has a circular indicator and a 4-step checklist that listens to `site_generation_jobs` via Realtime + polling. Will enhance the experience so the user clearly sees a progress bar and live step updates, and unify both entry points to use this screen.

### Changes

**1. `src/routes/sites.$id.gerando.tsx` — richer live progress**
- Add a horizontal `<Progress>` bar (shadcn) above the step list, with the percentage label on the right (e.g. "Gerando… 55%").
- Add a smooth client-side interpolator: between server checkpoints (10 → 30 → 55 → 90), animate the displayed value forward by ~1% every 600ms toward the next milestone, so the bar never sits frozen. Snap to the real value whenever the job row updates and lock at 100% when `status === "completed"`.
- Show a short live caption under the bar reflecting the current step ("Analisando o negócio…", "Criando o design…", etc.).
- Keep the circular indicator and existing step checklist (active step still spins, done steps get the check).
- Keep the failure UI and the auto-redirect to `/sites/$id` on completion.

**2. `src/components/dashboard/ProspectSearch.tsx`**
- After `generate({ data: { siteId } })` succeeds, navigate to `/sites/$id/gerando` (already done — verify nothing changed).

**3. `src/routes/dashboard.sites.tsx` — unify entry points**
- Replace the inline modal stepper with the same flow: create the site, call `generateSiteFn`, close the modal, and `navigate({ to: "/sites/$id/gerando", params: { id } })`. This way the "Novo Site" button on the Sites tab also leads to the live progress screen instead of a fake timed stepper inside the dialog.

### No backend changes
The `site_generation_jobs` table, RLS, Realtime publication and the `runGenerationWorker` checkpoints (10/30/55/90/100) already drive the UI. No SQL or server-function changes needed.

### Files touched
- `src/routes/sites.$id.gerando.tsx` (edit)
- `src/routes/dashboard.sites.tsx` (edit)
- `src/components/dashboard/ProspectSearch.tsx` (verify only)

