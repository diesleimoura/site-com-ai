import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/vendas")({
  component: VendasTab,
});

function VendasTab() {
  const { data } = useQuery({
    queryKey: ["vendas"],
    queryFn: async () => {
      const [paid, subs, mrr] = await Promise.all([
        supabase.from("proposals").select("*").eq("payment_status", "paid"),
        supabase.from("subscriptions").select("*").eq("status", "active"),
        supabase.from("subscriptions").select("monthly_price").eq("status", "active"),
      ]);
      const revenue = (mrr.data ?? []).reduce((s, r) => s + Number(r.monthly_price), 0);
      return { paid: paid.data ?? [], subs: subs.data ?? [], revenue };
    },
  });

  const stats = [
    { label: "Sites vendidos", value: data?.paid.length ?? 0 },
    { label: "Assinaturas ativas", value: data?.subs.length ?? 0 },
    { label: "Receita mensal", value: `R$ ${(data?.revenue ?? 0).toFixed(2).replace(".", ",")}` },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vendas</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Clientes</h3>
        {!data?.subs.length ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente ativo ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Cliente</th>
                <th>Mensalidade</th>
                <th>Próxima cobrança</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.subs.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2">{s.client_name ?? "—"}</td>
                  <td>R$ {Number(s.monthly_price).toFixed(2)}</td>
                  <td>{s.next_billing_date ?? "—"}</td>
                  <td className="text-success">Ativa</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
