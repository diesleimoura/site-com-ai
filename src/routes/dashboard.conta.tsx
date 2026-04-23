import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile, useInvalidateProfile } from "@/lib/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/conta")({
  component: ContaTab,
});

const slugSchema = z.string().min(3).max(40).regex(/^[a-z0-9-]+$/, "Use apenas letras, números e hífen");

function ContaTab() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const invalidateProfile = useInvalidateProfile();
  const [slug, setSlug] = React.useState("");
  React.useEffect(() => setSlug(profile?.slug ?? ""), [profile]);

  async function saveSlug() {
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Slug inválido");
    const { error } = await supabase.from("profiles").update({ slug: parsed.data }).eq("id", user!.id);
    if (error) {
      if (error.code === "23505") return toast.error("Este link já está em uso");
      return toast.error(error.message);
    }
    toast.success("Link salvo");
    invalidateProfile();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Conta</h2>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Seu link personalizado</h3>
        <div className="mt-3 flex gap-2">
          <span className="grid place-items-center rounded-md bg-muted px-3 text-sm text-muted-foreground">sitesai.app/</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} className="flex-1" />
          <Button onClick={saveSlug}>Salvar</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">Domínio próprio</h3>
            <p className="mt-1 text-sm text-muted-foreground">Conecte seu domínio (.com.br ou .com)</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
            <Lock className="h-3 w-3" /> Plano Pago
          </span>
        </div>
        <Input className="mt-3" disabled placeholder="meudominio.com.br" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Configurações da conta</h3>
        <div className="mt-3 space-y-3 text-sm">
          <Row label="Email">
            <span className="text-muted-foreground">{user?.email}</span>
            <Button size="sm" variant="ghost" disabled>Alterar</Button>
          </Row>
          <Row label="Senha">
            <span className="text-muted-foreground">••••••••</span>
            <Button size="sm" variant="ghost" disabled>Alterar</Button>
          </Row>
          <Row label="Conta">
            <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> Verificada</span>
            <span />
          </Row>
        </div>
      </div>

      <Button variant="outline" disabled>Rever tour</Button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="w-24 text-muted-foreground">{label}</span>
      <div className="flex flex-1 items-center justify-between gap-2">{children}</div>
    </div>
  );
}
