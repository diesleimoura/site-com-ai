import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Globe, FileText, CheckCircle2, Wallet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function StatsCards() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dash-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [sites, props, sold, revenue] = await Promise.all([
        supabase.from("sites").select("id", { count: "exact", head: true }),
        supabase.from("proposals").select("id", { count: "exact", head: true }),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
        supabase.from("wallet_transactions").select("amount").eq("type", "site_sale"),
      ]);
      const total = (revenue.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
      return {
        sites: sites.count ?? 0,
        proposals: props.count ?? 0,
        sold: sold.count ?? 0,
        revenue: total,
      };
    },
  });

  const stats = [
    { icon: Globe, label: "Sites criados", value: data?.sites ?? 0, color: "text-primary" },
    { icon: FileText, label: "Propostas", value: data?.proposals ?? 0, color: "text-warning" },
    { icon: CheckCircle2, label: "Vendidos", value: data?.sold ?? 0, color: "text-success" },
    {
      icon: Wallet,
      label: "Receita total",
      value: `R$ ${(data?.revenue ?? 0).toFixed(2).replace(".", ",")}`,
      color: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <p className="mt-2 text-2xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function PlanCards() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });
  const isFree = (profile?.plan ?? "free") === "free";
  const sitesUsed = profile?.sites_created_this_month ?? 0;
  const sitesLimit = isFree ? 2 : 80;
  const searchUsed = profile?.searches_used_this_month ?? 0;
  const searchLimit = isFree ? 1 : 10;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Plano atual</p>
            <h3 className="text-lg font-semibold">Plano Gratuito</h3>
          </div>
          <span className="rounded-full bg-muted px-2 py-1 text-xs">R$ 0/mês</span>
        </div>
        <div className="mt-4 space-y-3">
          <UsageRow label="Sites criados" used={sitesUsed} limit={sitesLimit} />
          <UsageRow label="Buscas de prospecção" used={searchUsed} limit={searchLimit} />
        </div>
      </div>
      <div className="relative rounded-xl border border-primary/40 bg-card p-5 shadow-[0_0_0_1px_var(--primary)]/0">
        <span className="absolute right-4 top-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
          Recomendado
        </span>
        <p className="text-xs uppercase text-primary">Upgrade</p>
        <h3 className="text-lg font-semibold">Plano Pro</h3>
        <p className="mt-1 text-2xl font-bold">
          R$ 89,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {["80 sites por mês", "50 edições com IA", "10 buscas Turbo", "Publicação + domínio próprio"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-primary" />
              {f}
            </li>
          ))}
        </ul>
        <Button className="mt-4 w-full">Fazer upgrade</Button>
      </div>
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used} / {limit}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}
