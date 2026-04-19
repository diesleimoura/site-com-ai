import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/dashboard/carteira")({
  component: CarteiraTab,
});

function CarteiraTab() {
  const { user } = useAuth();
  const { data: profile, refetch } = useQuery({
    queryKey: ["profile-wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });
  const { data: tx } = useQuery({
    queryKey: ["wallet-tx", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const available = (tx ?? []).filter((t) => t.status === "available").reduce((s, t) => s + Number(t.net_amount), 0);
  const pending = (tx ?? []).filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.net_amount), 0);
  const total = (tx ?? []).reduce((s, t) => s + Number(t.net_amount), 0);
  const sales = (tx ?? []).filter((t) => t.type === "site_sale" || t.type === "monthly_fee").reduce((s, t) => s + Number(t.net_amount), 0);
  const aff = (tx ?? []).filter((t) => t.type === "affiliate_commission").reduce((s, t) => s + Number(t.net_amount), 0);

  const [pixType, setPixType] = React.useState(profile?.pix_key_type ?? "cpf");
  const [pixKey, setPixKey] = React.useState(profile?.pix_key ?? "");
  React.useEffect(() => {
    setPixType(profile?.pix_key_type ?? "cpf");
    setPixKey(profile?.pix_key ?? "");
  }, [profile]);

  async function savePix() {
    if (!user) return;
    if (!pixKey.trim()) return toast.error("Informe a chave PIX");
    const { error } = await supabase
      .from("profiles")
      .update({ pix_key_type: pixType, pix_key: pixKey.trim() })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Chave PIX salva");
    refetch();
  }

  async function requestWithdrawal() {
    if (!profile?.pix_key) return toast.error("Cadastre uma chave PIX primeiro");
    if (available <= 0) return toast.error("Sem saldo disponível");
    const { error } = await supabase.from("withdrawals").insert({
      tenant_id: user!.id,
      amount: available,
      pix_key: profile.pix_key,
      pix_key_type: profile.pix_key_type ?? "cpf",
    });
    if (error) return toast.error(error.message);
    toast.success("Saque solicitado");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Carteira</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Disponível para saque" value={available} color="text-success" />
        <StatCard label="Pendente (7 dias)" value={pending} color="text-warning" />
        <StatCard label="Total recebido" value={total} color="text-foreground" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Origem dos Ganhos</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-md border border-border p-3">
            <p className="text-muted-foreground">Vendas de sites</p>
            <p className="text-lg font-bold">R$ {sales.toFixed(2)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-muted-foreground">Comissões afiliado</p>
            <p className="text-lg font-bold">R$ {aff.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Chave PIX</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr_auto]">
          <Select value={pixType} onValueChange={setPixType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="random">Aleatória</SelectItem>
            </SelectContent>
          </Select>
          <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Sua chave PIX" />
          <Button onClick={savePix}>Salvar</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Solicitar Saque</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.pix_key ? "Sua chave PIX está ativa." : "Cadastre sua chave PIX para habilitar saques."}
        </p>
        <Button onClick={requestWithdrawal} disabled={!profile?.pix_key || available <= 0} className="mt-3">
          Solicitar saque de R$ {available.toFixed(2)}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HistoryCard title="Saques" items={(withdrawals ?? []).map((w) => ({ key: w.id, label: `R$ ${Number(w.amount).toFixed(2)}`, sub: w.status }))} />
        <HistoryCard
          title="Pagamentos recebidos"
          items={(tx ?? []).map((t) => ({ key: t.id, label: `R$ ${Number(t.net_amount).toFixed(2)}`, sub: t.type }))}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>R$ {value.toFixed(2).replace(".", ",")}</p>
    </div>
  );
}

function HistoryCard({ title, items }: { title: string; items: { key: string; label: string; sub: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem registros.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between border-t border-border pt-2 first:border-0 first:pt-0">
              <span>{i.label}</span>
              <span className="text-muted-foreground">{i.sub}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
