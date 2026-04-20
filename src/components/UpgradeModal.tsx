import { useNavigate } from "@tanstack/react-router";
import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Resource = "sites" | "searches";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource;
  used: number;
  limit: number;
  plan?: string;
}

export function UpgradeModal({ open, onOpenChange, resource, used, limit, plan = "free" }: UpgradeModalProps) {
  const navigate = useNavigate();
  const isSites = resource === "sites";
  const limitText = Number.isFinite(limit) ? limit : "∞";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Limite do plano atingido</DialogTitle>
          <DialogDescription>
            Você usou <strong>{used}/{limitText}</strong>{" "}
            {isSites ? "sites criados" : "buscas de prospecção"} no seu plano{" "}
            <strong>{plan === "free" ? "Grátis" : plan}</strong> este mês.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-medium">Faça upgrade e desbloqueie:</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" /> Até 80 sites/mês (Pro) ou ilimitado (Agência)
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" /> Buscas Turbo de empresas
            </li>
            <li className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" /> Publicação e domínio próprio
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/turbo" });
            }}
          >
            <Crown className="h-4 w-4" /> Ver planos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
