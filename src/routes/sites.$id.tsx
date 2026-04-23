import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { createProposalFn } from "@/server/proposals.functions";
import { EditorToolbar } from "@/components/site-editor/EditorToolbar";
import { AiChatPanel } from "@/components/site-editor/AiChatPanel";
import { PreviewFrame } from "@/components/site-editor/PreviewFrame";
import type { Viewport } from "@/components/site-editor/ViewportToggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sites/$id")({
  component: SitePreviewPage,
});

function SitePreviewPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [viewport, setViewport] = React.useState<Viewport>("desktop");
  const [proposalOpen, setProposalOpen] = React.useState(false);

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando...</div>;
  }
  if (!site) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Site não encontrado</div>;
  }

  const slug = site.business_name;
  const url = `https://${slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.sitesai.app`;

  return (
    <div className="flex h-screen flex-col bg-background">
      <EditorToolbar
        slug={slug}
        viewport={viewport}
        onViewportChange={setViewport}
        onCreateProposal={() => setProposalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-auto bg-muted/40 p-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <div className="ml-3 flex-1 truncate rounded bg-background px-3 py-1 text-xs text-muted-foreground">
                {url}
              </div>
            </div>
            <div className={cn(
              "flex justify-center bg-background",
              viewport === "mobile" ? "p-4" : "",
            )}>
              <PreviewFrame
                title={slug}
                html={site.html_content}
                viewport={viewport}
              />
            </div>
          </div>
        </main>

        <div className="hidden w-[380px] shrink-0 lg:block">
          <AiChatPanel
            siteId={site.id}
            hasHtml={!!site.html_content}
            onUpdated={() => qc.invalidateQueries({ queryKey: ["site", id] })}
          />
        </div>
      </div>

      <ProposalModal
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        siteId={site.id}
        defaultSetup={Number(site.setup_price ?? 497)}
        defaultMonthly={Number(site.monthly_price ?? 49)}
      />
    </div>
  );
}

const propSchema = z.object({
  setup: z.number().min(0).max(99999),
  monthly: z.number().min(0).max(99999),
});

function ProposalModal({
  open, onOpenChange, siteId, defaultSetup, defaultMonthly,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  siteId: string;
  defaultSetup: number;
  defaultMonthly: number;
}) {
  const create = useServerFn(createProposalFn);
  const navigate = useNavigate();
  const [setup, setSetup] = React.useState(defaultSetup);
  const [monthly, setMonthly] = React.useState(defaultMonthly);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    const parsed = propSchema.safeParse({ setup, monthly });
    if (!parsed.success) return toast.error("Valores inválidos");
    setBusy(true);
    try {
      const res = await create({ data: { siteId, setupPrice: parsed.data.setup, monthlyPrice: parsed.data.monthly } });
      toast.success("Proposta criada");
      onOpenChange(false);
      navigate({ to: "/proposta/$token", params: { token: res.token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Configurar Proposta</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Valor do site (R$)</Label>
            <Input type="number" value={setup} onChange={(e) => setSetup(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Mensalidade (R$)</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value) || 0)} />
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <strong>R$ {setup.toFixed(2)}</strong> (setup) + <strong>R$ {monthly.toFixed(2)}/mês</strong>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar Proposta
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
