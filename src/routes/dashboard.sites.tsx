import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Eye, FileText, Trash2, Loader2 } from "lucide-react";
import { generateSiteFn } from "@/server/sites.functions";
import { UpgradeModal } from "@/components/UpgradeModal";

export const Route = createFileRoute("/dashboard/sites")({
  component: SitesTab,
});

const siteSchema = z.object({
  business_name: z.string().min(2).max(120),
  segment: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

function NewSiteModal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const generate = useServerFn(generateSiteFn);
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [upgrade, setUpgrade] = React.useState<
    { resource: "sites" | "searches"; used: number; limit: number; plan: string } | null
  >(null);

  function handlePlanError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : "";
    const m = msg.match(/^PLAN_LIMIT_(SITES|SEARCHES):(\d+):(\d+):(\w+)/);
    if (!m) return false;
    setUpgrade({
      resource: m[1] === "SITES" ? "sites" : "searches",
      used: Number(m[2]),
      limit: Number(m[3]),
      plan: m[4],
    });
    setOpen(false);
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = siteSchema.safeParse({
      business_name: String(fd.get("business_name") ?? ""),
      segment: String(fd.get("segment") ?? ""),
      city: String(fd.get("city") ?? ""),
      description: String(fd.get("description") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const { data: site, error } = await supabase
        .from("sites")
        .insert({
          tenant_id: user.id,
          business_name: parsed.data.business_name,
          segment: parsed.data.segment,
          city: parsed.data.city,
          status: "rascunho",
        })
        .select("id")
        .single();
      if (error || !site) throw new Error(error?.message ?? "Falha ao criar");

      await generate({ data: { siteId: site.id } });
      qc.invalidateQueries({ queryKey: ["sites"] });
      setOpen(false);
      navigate({ to: "/sites/$id/gerando", params: { id: site.id } });
    } catch (err) {
      if (!handlePlanError(err)) {
        toast.error(err instanceof Error ? err.message : "Falha");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo Site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo site com IA</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="business_name">Nome do negócio</Label>
            <Input id="business_name" name="business_name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="segment">Segmento</Label>
              <Input id="segment" name="segment" placeholder="Ex.: Dentista" required />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" required />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Iniciando…
                </>
              ) : (
                "Gerar com IA"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {upgrade && (
      <UpgradeModal
        open={!!upgrade}
        onOpenChange={(o) => !o && setUpgrade(null)}
        resource={upgrade.resource}
        used={upgrade.used}
        limit={upgrade.limit}
        plan={upgrade.plan}
      />
    )}
    </>
  );
}

function SitesTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: sites, isLoading } = useQuery({
    queryKey: ["sites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function deleteSite(id: string) {
    if (!confirm("Excluir este site?")) return;
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Site excluído");
      qc.invalidateQueries({ queryKey: ["sites"] });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Meus Sites</h2>
        <NewSiteModal />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !sites || sites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Nenhum site criado ainda. Clique em "Novo Site" para começar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{s.business_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.segment}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.city}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to="/sites/$id" params={{ id: s.id }}>
                        <Button size="icon" variant="ghost" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to="/sites/$id" params={{ id: s.id }}>
                        <Button size="icon" variant="ghost" title="Proposta">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Excluir"
                        onClick={() => deleteSite(s.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    rascunho: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
    proposta_enviada: { label: "Proposta enviada", cls: "bg-warning/20 text-warning" },
    fechado: { label: "Fechado", cls: "bg-success/20 text-success" },
    publicado: { label: "Publicado", cls: "bg-primary/20 text-primary" },
  };
  const m = map[status] ?? map.rascunho;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}
