import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Zap, Check, Crown, Rocket, Search, Filter, Download, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/turbo")({
  component: TurboPage,
  head: () => ({
    meta: [
      { title: "Modo Turbo — Upgrade | SitesAI" },
      { name: "description", content: "Desbloqueie buscas em massa, sites ilimitados e publicação com os planos Pro e Agência." },
    ],
  }),
});

const PLANS = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    icon: Zap,
    current: true,
    highlight: false,
    features: [
      "2 sites por mês",
      "5 edições com IA",
      "1 busca de prospecção",
      "Sem publicação",
      "Sem domínio próprio",
    ],
    cta: "Plano atual",
  },
  {
    name: "Pro",
    price: "R$ 89,90",
    period: "/mês",
    icon: Crown,
    current: false,
    highlight: true,
    badge: "Mais popular",
    features: [
      "80 sites por mês",
      "50 edições com IA",
      "10 buscas Turbo/mês",
      "Publicação ilimitada",
      "Domínio próprio",
      "Checkout integrado",
    ],
    cta: "Assinar Pro",
  },
  {
    name: "Agência",
    price: "R$ 299",
    period: "/mês",
    icon: Rocket,
    current: false,
    highlight: false,
    badge: "Melhor custo",
    features: [
      "Sites ilimitados",
      "Edições ilimitadas",
      "20 buscas Turbo/mês",
      "Tudo do plano Pro",
      "Suporte prioritário",
    ],
    cta: "Assinar Agência",
  },
] as const;

const TURBO_PERKS = [
  { icon: Search, title: "Busca em massa", desc: "Encontre dezenas de empresas sem site em segundos por segmento + cidade." },
  { icon: Filter, title: "Filtros avançados", desc: "Filtre por nota, número de avaliações, raio e mais — só leads quentes." },
  { icon: InfinityIcon, title: "Geração ilimitada", desc: "Gere landing pages instantaneamente para cada lead encontrado." },
  { icon: Download, title: "Exportar leads", desc: "Baixe sua lista em CSV e dispare campanhas no WhatsApp." },
];

function TurboPage() {
  const handleSubscribe = (plan: string) => {
    toast.info(`Pagamentos chegam em breve para o plano ${plan}.`);
  };

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

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-12">
        {/* Hero */}
        <section className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase text-warning">
            <Zap className="h-3.5 w-3.5" /> Upgrade necessário
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Desbloqueie o <span className="text-primary">Modo Turbo</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            No plano Grátis você tem 1 busca por mês. Faça upgrade para Pro ou Agência e prospecte
            em massa, gere sites ilimitados e feche mais clientes.
          </p>
        </section>

        {/* Plans */}
        <section className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                  plan.highlight
                    ? "border-primary shadow-[0_0_60px_-15px_var(--primary)]"
                    : "border-border"
                }`}
              >
                {"badge" in plan && plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-success text-success-foreground"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      plan.highlight ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                </div>
                <p className="mt-4 text-4xl font-extrabold">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.highlight ? "text-primary" : "text-success"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.highlight ? "default" : plan.current ? "outline" : "secondary"}
                  disabled={plan.current}
                  onClick={() => !plan.current && handleSubscribe(plan.name)}
                >
                  {plan.cta}
                </Button>
              </div>
            );
          })}
        </section>

        {/* Perks */}
        <section>
          <h3 className="text-center text-2xl font-bold">O que você ganha com o Turbo</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TURBO_PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h4 className="mt-3 font-semibold">{perk.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{perk.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Já assinou um plano pago?{" "}
            <Link
              to="/dashboard/cobranca"
              className="font-medium text-primary hover:underline"
            >
              Ver minha assinatura
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
