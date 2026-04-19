import { createFileRoute, Link } from "@tanstack/react-router";
import { ProspectSearch } from "@/components/dashboard/ProspectSearch";
import { ArrowLeft, Zap } from "lucide-react";

export const Route = createFileRoute("/turbo")({
  component: TurboPage,
});

function TurboPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link
            to="/dashboard/sites"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">|</span>
          <h1 className="inline-flex items-center gap-1.5 font-semibold">
            <Zap className="h-4 w-4 text-warning" /> Modo Turbo
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <strong>Plano Gratuito:</strong> 1 busca por mês. Faça upgrade para liberar o Turbo
          completo com 10 buscas/mês e descobertas em massa.
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">⚡ O que é o Modo Turbo?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tela em foco para prospecção rápida: busque por segmento + cidade + raio, filtre só
            empresas sem site e gere landing pages instantaneamente.
          </p>
        </div>
        <ProspectSearch />
      </main>
    </div>
  );
}
