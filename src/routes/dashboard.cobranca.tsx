import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/dashboard/cobranca")({
  component: CobrancaTab,
});

function CobrancaTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Cobrança</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Plano atual</p>
          <h3 className="mt-1 text-lg font-semibold">Sem plano ativo</h3>
          <p className="mt-2 text-sm text-muted-foreground">Você está no plano gratuito.</p>
          <Link to="/planos">
            <Button className="mt-4">Ver planos</Button>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Forma de pagamento</p>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <CreditCard className="h-5 w-5" /> Nenhum cartão cadastrado
          </div>
          <Button variant="outline" className="mt-4" disabled>
            Adicionar cartão (em breve)
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Histórico de faturas</h3>
        <p className="mt-2 text-sm text-muted-foreground">Sem faturas ainda.</p>
      </div>
    </div>
  );
}
