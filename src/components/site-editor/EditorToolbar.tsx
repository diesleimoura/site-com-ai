import * as React from "react";
import { toast } from "sonner";
import {
  Save,
  Link as LinkIcon,
  Globe,
  Search,
  Globe2,
  History,
  Users,
  Settings,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ViewportToggle, type Viewport } from "./ViewportToggle";

interface Props {
  slug: string;
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
  onCreateProposal: () => void;
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick} className="h-8 w-8">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({
  slug,
  viewport,
  onViewportChange,
  onCreateProposal,
}: Props) {
  const publicUrl = `https://${slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.sitesai.app`;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(
      () => toast.success("Link copiado", { description: publicUrl }),
      () => toast.error("Falha ao copiar"),
    );
  }

  const soon = (name: string) => () => toast.info(`${name} em breve`);

  return (
    <TooltipProvider delayDuration={200}>
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/sites"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toast.success("Salvo automaticamente", {
                  description: "Cada edição via IA é salva na hora.",
                })
              }
            >
              <Save className="h-4 w-4" /> Salvar
            </Button>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <LinkIcon className="h-4 w-4" /> Gerar Link
            </Button>
            <Button variant="default" size="sm" onClick={soon("Publicar Site")}>
              <Globe className="h-4 w-4" /> Publicar Site
            </Button>

            <div className="mx-2 h-6 w-px bg-border" />

            <IconBtn label="SEO" onClick={soon("SEO")}>
              <Search className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Domínio" onClick={soon("Domínio")}>
              <Globe2 className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Versões" onClick={soon("Versões")}>
              <History className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Equipe" onClick={soon("Equipe")}>
              <Users className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Configurações" onClick={soon("Configurações")}>
              <Settings className="h-4 w-4" />
            </IconBtn>

            <div className="mx-2 h-6 w-px bg-border" />

            <ViewportToggle value={viewport} onChange={onViewportChange} />

            <div className="mx-2 h-6 w-px bg-border" />

            <Button size="sm" variant="secondary" onClick={onCreateProposal}>
              <FileText className="h-4 w-4" /> Criar Proposta
            </Button>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
