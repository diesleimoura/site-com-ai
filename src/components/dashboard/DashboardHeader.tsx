import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, MessageCircle, LogOut, Globe } from "lucide-react";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
        <Link to="/dashboard/sites" className="flex items-center gap-2 text-base font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          SitesAI
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="https://chat.whatsapp.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--success)] px-3 py-1.5 text-sm font-medium text-[var(--success-foreground)] hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> Grupo VIP WhatsApp
          </a>
          <Link to="/turbo">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Zap className="h-4 w-4 text-warning" /> Turbo
            </Button>
          </Link>
          <span className="hidden text-xs text-muted-foreground md:inline">{user?.email}</span>
          <Button variant="ghost" size="icon" title="Idioma">
            <Globe className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Sair"
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

const TABS = [
  ["sites", "Sites"],
  ["vendas", "Vendas"],
  ["prospectar", "Prospectar"],
  ["crm", "CRM"],
  ["carteira", "Carteira"],
  ["afiliados", "Afiliados"],
  ["cobranca", "Cobrança"],
  ["logos", "Logos"],
  ["conta", "Conta"],
] as const;

export function DashboardTabs() {
  const location = useLocation();
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
        {TABS.map(([slug, label]) => {
          const to = `/dashboard/${slug}`;
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={slug}
              to={to}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
