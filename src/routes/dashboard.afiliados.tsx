import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Copy } from "lucide-react";

export const Route = createFileRoute("/dashboard/afiliados")({
  component: AfiliadosTab,
});

function AfiliadosTab() {
  const { user } = useAuth();
  const { data: profile, refetch } = useQuery({
    queryKey: ["profile-aff", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  async function activate() {
    const { error } = await supabase.from("profiles").update({ affiliate_active: true }).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Programa de afiliados ativado");
    refetch();
  }

  if (!profile?.affiliate_active) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-10 text-center">
        <Users className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Programa de Afiliados</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ganhe <strong className="text-foreground">25%</strong> da primeira parcela e
          <strong className="text-foreground"> 10% recorrente</strong> de quem assinar pelo seu link.
        </p>
        <Button onClick={activate} className="mt-6">
          Ativar afiliados
        </Button>
      </div>
    );
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${profile.affiliate_code}` : "";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Afiliados</h2>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase text-muted-foreground">Seu link</p>
        <div className="mt-2 flex gap-2">
          <input readOnly value={link} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success("Link copiado");
            }}
          >
            <Copy className="h-4 w-4" /> Copiar
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Comissões ganhas", value: "R$ 0,00" },
          { label: "Indicações", value: 0 },
          { label: "Recorrências", value: 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
