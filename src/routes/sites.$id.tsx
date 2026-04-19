import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Pencil, FileText, Loader2 } from "lucide-react";
import { editSiteFn } from "@/server/sites.functions";
import { createProposalFn } from "@/server/proposals.functions";

export const Route = createFileRoute("/sites/$id")({
  component: SitePreviewPage,
});

function SitePreviewPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/dashboard/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <EditModal siteId={site.id} html={site.html_content ?? ""} onDone={() => qc.invalidateQueries({ queryKey: ["site", id] })} />
            <ProposalModal siteId={site.id} defaultSetup={Number(site.setup_price ?? 497)} defaultMonthly={Number(site.monthly_price ?? 49)} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        <BrowserFrame slug={site.business_name}>
          <iframe
            title={site.business_name}
            srcDoc={site.html_content ?? "<html><body><p style='font-family:sans-serif;padding:2rem'>Sem conteúdo gerado</p></body></html>"}
            className="h-[80vh] w-full border-0"
            sandbox="allow-same-origin"
          />
        </BrowserFrame>
      </main>
    </div>
  );
}

function BrowserFrame({ children, slug }: { children: React.ReactNode; slug: string }) {
  const url = `https://${slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.sitesai.app`;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning" />
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        <div className="ml-3 flex-1 truncate rounded bg-background px-3 py-1 text-xs text-muted-foreground">{url}</div>
      </div>
      {children}
    </div>
  );
}

function EditModal({ siteId, html, onDone }: { siteId: string; html: string; onDone: () => void }) {
  const edit = useServerFn(editSiteFn);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const instruction = String(fd.get("instruction") ?? "").trim();
    if (instruction.length < 3) return toast.error("Descreva a alteração");
    if (!html) return toast.error("Site sem HTML para editar");
    setBusy(true);
    try {
      await edit({ data: { siteId, instruction } });
      toast.success("Site atualizado");
      onDone();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" /> Editar site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar com IA</DialogTitle></DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <Label htmlFor="instruction">Instrução</Label>
          <Textarea
            id="instruction"
            name="instruction"
            rows={4}
            placeholder="Ex.: troque o título do hero por algo mais direto e mude as cores para tons de verde."
          />
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const propSchema = z.object({
  setup: z.number().min(0).max(99999),
  monthly: z.number().min(0).max(99999),
});

function ProposalModal({ siteId, defaultSetup, defaultMonthly }: { siteId: string; defaultSetup: number; defaultMonthly: number }) {
  const create = useServerFn(createProposalFn);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
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
      setOpen(false);
      navigate({ to: "/proposta/$token", params: { token: res.token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileText className="h-4 w-4" /> Criar Proposta
        </Button>
      </DialogTrigger>
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
