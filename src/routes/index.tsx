import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard/sites" });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            SitesAI
          </div>
          <div className="flex items-center gap-3">
            <Link to="/planos" className="text-sm text-muted-foreground hover:text-foreground">
              Planos
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" /> Prospecção + IA + Pagamentos em um só lugar
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Crie e venda <span className="text-primary">sites com IA</span> para empresas locais
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Encontre empresas sem site, gere landing pages em segundos e feche vendas com proposta
            pública e checkout integrado.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg">Começar grátis</Button>
            </Link>
            <Link to="/planos">
              <Button size="lg" variant="outline">
                Ver planos
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "Geração com IA",
              desc: "Landing pages prontas em segundos com Hero, serviços, depoimentos e CTA.",
            },
            {
              icon: <Zap className="h-5 w-5" />,
              title: "Modo Turbo",
              desc: "Prospecte centenas de empresas locais sem site num clique.",
            },
            {
              icon: <Wallet className="h-5 w-5" />,
              title: "Carteira & PIX",
              desc: "Receba pelos sites vendidos e saque direto pra sua chave PIX.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
