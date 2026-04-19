import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/planos")({
  component: PlanosPage,
  head: () => ({
    meta: [
      { title: "Planos — SitesAI" },
      { name: "description", content: "Compare os planos: Grátis, Pro e Agência." },
    ],
  }),
});

const PLANS = [
  {
    name: "Grátis",
    price: "R$ 0",
    cta: "Começar agora",
    highlight: false,
    features: ["2 sites por mês", "5 edições com IA", "1 busca de prospecção", "Visualização", "Sem publicação"],
  },
  {
    name: "Pro",
    price: "R$ 89,90",
    period: "/mês",
    cta: "Assinar Pro",
    highlight: true,
    features: ["80 sites por mês", "50 edições com IA", "10 buscas Turbo", "Publicação", "Domínio próprio", "Checkout"],
  },
  {
    name: "Agência",
    price: "R$ 299",
    period: "/mês",
    cta: "Assinar Agência",
    highlight: false,
    features: ["Sites ilimitados", "Edições ilimitadas", "20 buscas Turbo", "Tudo do plano Pro"],
  },
];

function PlanosPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            SitesAI
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">Entrar</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">Planos para qualquer escala</h1>
          <p className="mt-2 text-muted-foreground">Comece grátis. Faça upgrade quando precisar de mais.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-card p-6 ${
                p.highlight ? "border-primary shadow-[0_0_40px_-10px_var(--primary)]" : "border-border"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
                  Mais popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 text-4xl font-extrabold">
                {p.price}
                {p.period && <span className="text-base font-normal text-muted-foreground">{p.period}</span>}
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-6 block">
                <Button className="w-full" variant={p.highlight ? "default" : "outline"}>{p.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
