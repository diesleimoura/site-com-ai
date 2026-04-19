import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { getPublicProposalFn, submitProposalLeadFn } from "@/server/proposals.functions";

export const Route = createFileRoute("/proposta/$token")({
  component: PublicProposalPage,
});

const leadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(8).max(30),
  method: z.enum(["pix", "card"]),
});

function PublicProposalPage() {
  const { token } = Route.useParams();
  const fetchProp = useServerFn(getPublicProposalFn);
  const submit = useServerFn(submitProposalLeadFn);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-proposal", token],
    queryFn: async () => fetchProp({ data: { token } }),
    retry: false,
  });

  const [method, setMethod] = React.useState<"pix" | "card">("pix");
  const [busy, setBusy] = React.useState(false);

  if (isLoading)
    return <div className="light min-h-screen bg-background py-20 text-center text-muted-foreground">Carregando proposta...</div>;
  if (error || !data)
    return <div className="light min-h-screen bg-background py-20 text-center text-muted-foreground">Proposta não encontrada</div>;

  const total = Number(data.proposal.setup_price);
  const monthly = Number(data.proposal.monthly_price);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = leadSchema.safeParse({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      method,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
    setBusy(true);
    try {
      await submit({ data: { token, ...parsed.data } });
      toast.success(method === "pix" ? "PIX gerado! (demo — pagamentos reais na fase 2)" : "Cartão — demo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="light min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="inline-flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Proposta SitesAI
          </span>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("Confira sua proposta: " + (typeof window !== "undefined" ? window.location.href : ""))}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-success-foreground"
          >
            <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-2">
        <section>
          <p className="text-sm uppercase text-muted-foreground">Preview do seu site</p>
          <h1 className="text-2xl font-bold">{data.site?.business_name}</h1>
          <p className="text-sm text-muted-foreground">{data.site?.segment} — {data.site?.city}</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <iframe
              title="Preview"
              srcDoc={data.site?.html_content ?? ""}
              className="h-[480px] w-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Investimento</p>
            <p className="mt-1 text-4xl font-extrabold text-primary">
              R$ {total.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-sm text-muted-foreground">
              + R$ {monthly.toFixed(2).replace(".", ",")} / mês de hospedagem
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {["Design profissional sob medida", "SSL e domínio", "100% mobile responsivo", "Hospedagem incluída"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3 rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">Seus dados</h3>
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" name="phone" required placeholder="(11) 99999-0000" />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["pix", "card"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      method === m ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {m === "pix" ? "PIX (à vista)" : "Cartão (até 12x)"}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className={`w-full ${method === "pix" ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
            >
              {method === "pix" ? "Gerar PIX" : "Parcelar no cartão"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
