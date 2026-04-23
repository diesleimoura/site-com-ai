import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useInvalidateProfile } from "@/lib/use-profile";
import { Search, Palette, FileText, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/sites/$id/gerando")({
  component: GeneratingPage,
});

type Step = "analyzing" | "designing" | "writing" | "finalizing";
type JobRow = {
  id: string;
  status: string;
  step: Step;
  progress: number;
  error_message: string | null;
};

const STEPS: { key: Step; label: string; caption: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "analyzing", label: "Analisando o negócio", caption: "Analisando o negócio…", Icon: Search },
  { key: "designing", label: "Criando o design", caption: "Criando o design…", Icon: Palette },
  { key: "writing", label: "Escrevendo os textos", caption: "Escrevendo os textos…", Icon: FileText },
  { key: "finalizing", label: "Finalizando o site", caption: "Finalizando o site…", Icon: CheckCircle2 },
];

const STEP_ORDER: Record<Step, number> = {
  analyzing: 0,
  designing: 1,
  writing: 2,
  finalizing: 3,
};

// Server-side checkpoints from runGenerationWorker
const CHECKPOINTS = [10, 30, 55, 90, 100];

function nextCheckpoint(current: number): number {
  for (const c of CHECKPOINTS) {
    if (c > current) return c;
  }
  return 100;
}

function GeneratingPage() {
  const { id: siteId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const invalidateProfile = useInvalidateProfile();
  const [job, setJob] = React.useState<JobRow | null>(null);
  const [businessName, setBusinessName] = React.useState<string>("");
  const [displayProgress, setDisplayProgress] = React.useState(0);
  const [lastJobUpdateAt, setLastJobUpdateAt] = React.useState<number>(Date.now());
  const [now, setNow] = React.useState<number>(Date.now());
  const jobStartedAtRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const applyJob = (row: JobRow | null) => {
      if (!row) return;
      setJob(row);
      setLastJobUpdateAt(Date.now());
    };

    (async () => {
      const { data: site } = await supabase
        .from("sites")
        .select("business_name")
        .eq("id", siteId)
        .single();
      if (!cancelled && site) setBusinessName(site.business_name);

      const { data } = await supabase
        .from("site_generation_jobs")
        .select("id, status, step, progress, error_message")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) applyJob(data as JobRow);
    })();

    const channel = supabase
      .channel(`job-${siteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_generation_jobs", filter: `site_id=eq.${siteId}` },
        (payload) => {
          const row = payload.new as JobRow;
          if (row) applyJob(row);
        },
      )
      .subscribe((status) => {
        console.log(`[gerando] realtime channel status:`, status);
      });

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("site_generation_jobs")
        .select("id, status, step, progress, error_message")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) applyJob(data as JobRow);
    }, 2000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [siteId, user]);

  // Tick clock for heartbeat / watchdog UI
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Snap displayed progress to real progress whenever the job updates
  React.useEffect(() => {
    if (!job) return;
    setDisplayProgress((prev) => Math.max(prev, job.progress));
    if (job.status === "completed") setDisplayProgress(100);
  }, [job]);

  // Continuous interpolation that never stalls — eases toward next checkpoint
  // with a guaranteed minimum step so the bar always moves during long phases.
  React.useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const TICK_MS = 400;
    const MIN_STEP = 0.15;
    const EASE = 0.04;
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        const target = nextCheckpoint(job.progress);
        const ceiling = target - 0.05;
        if (prev >= ceiling) return prev;
        const delta = Math.max(MIN_STEP, (target - prev) * EASE);
        return Math.min(prev + delta, ceiling);
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [job]);

  React.useEffect(() => {
    if (job?.status === "completed") {
      invalidateProfile();
      const t = setTimeout(() => {
        navigate({ to: "/sites/$id", params: { id: siteId } });
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [job?.status, navigate, siteId, invalidateProfile]);

  const currentStepIdx = job ? STEP_ORDER[job.step] : 0;
  const failed = job?.status === "failed";
  const completed = job?.status === "completed";
  const stalledMs = now - lastJobUpdateAt;
  const totalMs = now - jobStartedAtRef.current;
  const isWritingHeartbeat = !completed && !failed && job?.step === "writing" && stalledMs > 15000;
  const showWatchdog = !completed && !failed && totalMs > 180000;
  const baseCaption = STEPS[currentStepIdx]?.caption ?? "Iniciando…";
  const currentCaption = completed
    ? "Site pronto!"
    : failed
      ? "Falha ao gerar"
      : isWritingHeartbeat
        ? "Escrevendo os textos… (gerando com Claude Sonnet, isso pode levar até 1 min)"
        : baseCaption;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative h-24 w-24 mb-6">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - displayProgress / 100)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            {!failed && !completed && (
              <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
            )}
            {completed && (
              <CheckCircle2 className="absolute inset-0 m-auto h-8 w-8 text-success" />
            )}
            {failed && (
              <AlertTriangle className="absolute inset-0 m-auto h-8 w-8 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {failed ? "Falha ao gerar" : completed ? "Site pronto!" : "Gerando site com IA…"}
          </h1>
          {businessName && (
            <p className="mt-1 text-sm text-muted-foreground">{businessName}</p>
          )}
        </div>

        {/* Live progress bar */}
        {!failed && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{currentCaption}</span>
              <span className="font-medium tabular-nums">{Math.round(displayProgress)}%</span>
            </div>
            <Progress value={displayProgress} className="h-2" />
          </div>
        )}

        <div className="space-y-2">
          {STEPS.map(({ key, label, Icon }, idx) => {
            const isDone = idx < currentStepIdx || completed;
            const isActive = idx === currentStepIdx && !completed && !failed;
            const isPending = idx > currentStepIdx && !failed;
            return (
              <div
                key={key}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : isDone
                      ? "border-success/40 bg-success/5"
                      : "border-border bg-card opacity-60"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    isDone ? "bg-success/20 text-success" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-sm font-medium ${isPending ? "text-muted-foreground" : "text-foreground"}`}>
                  {label}
                </span>
                {isActive && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
              </div>
            );
          })}
        </div>

        {failed && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-destructive text-center">
              {job?.error_message ?? "Erro desconhecido"}
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/dashboard/prospectar" })}>
              Voltar
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          A geração de qualidade leva cerca de 30-60 segundos. Pode deixar a aba aberta.
        </p>
      </div>
    </div>
  );
}
