import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useInvalidateProfile } from "@/lib/use-profile";
import { Search, Palette, FileText, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const STEPS: { key: Step; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "analyzing", label: "Analisando o negócio", Icon: Search },
  { key: "designing", label: "Criando o design", Icon: Palette },
  { key: "writing", label: "Escrevendo os textos", Icon: FileText },
  { key: "finalizing", label: "Finalizando o site", Icon: CheckCircle2 },
];

const STEP_ORDER: Record<Step, number> = {
  analyzing: 0,
  designing: 1,
  writing: 2,
  finalizing: 3,
};

function GeneratingPage() {
  const { id: siteId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const invalidateProfile = useInvalidateProfile();
  const [job, setJob] = React.useState<JobRow | null>(null);
  const [businessName, setBusinessName] = React.useState<string>("");

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

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
      if (!cancelled && data) setJob(data as JobRow);
    })();

    const channel = supabase
      .channel(`job-${siteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_generation_jobs", filter: `site_id=eq.${siteId}` },
        (payload) => {
          const row = payload.new as JobRow;
          if (row) setJob(row);
        },
      )
      .subscribe();

    // Fallback polling a cada 3s caso o realtime falhe
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("site_generation_jobs")
        .select("id, status, step, progress, error_message")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setJob(data as JobRow);
    }, 3000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [siteId, user]);

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
  const progress = job?.progress ?? 0;
  const failed = job?.status === "failed";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
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
                strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            {!failed && (
              <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
            )}
            {failed && (
              <AlertTriangle className="absolute inset-0 m-auto h-8 w-8 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {failed ? "Falha ao gerar" : job?.status === "completed" ? "Site pronto!" : "Gerando site com IA…"}
          </h1>
          {businessName && (
            <p className="mt-1 text-sm text-muted-foreground">{businessName}</p>
          )}
        </div>

        <div className="space-y-2">
          {STEPS.map(({ key, label, Icon }, idx) => {
            const isDone = idx < currentStepIdx || job?.status === "completed";
            const isActive = idx === currentStepIdx && job?.status !== "completed" && !failed;
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
