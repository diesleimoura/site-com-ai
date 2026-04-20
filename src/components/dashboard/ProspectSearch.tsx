import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Star, Zap, Globe } from "lucide-react";
import { prospectSearchFn } from "@/server/prospect.functions";
import { generateSiteFn } from "@/server/sites.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { UpgradeModal } from "@/components/UpgradeModal";

export const SUGGESTIONS = [
  "Dentista", "Advogado", "Psicólogo", "Academia", "Restaurante", "Médico", "Veterinário",
  "Contador", "Arquiteto", "Fotógrafo", "Personal Trainer", "Imobiliária", "Oficina Mecânica",
  "Pet Shop", "Escola", "Padaria", "Floricultura", "Farmácia", "Hotel", "Clínica Estética",
  "Eletricista", "Papelaria",
];

type Result = {
  place_id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  total_ratings: number;
  has_website: boolean;
  phone: string;
};

export function ProspectSearch({ compact = false }: { compact?: boolean }) {
  const search = useServerFn(prospectSearchFn);
  const generate = useServerFn(generateSiteFn);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [segment, setSegment] = React.useState("");
  const [city, setCity] = React.useState("");
  const [radius, setRadius] = React.useState(5);
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState<Result[]>([]);
  const [filter, setFilter] = React.useState<"all" | "no_site">("all");
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!segment || !city) return toast.error("Preencha segmento e cidade");
    setBusy(true);
    try {
      const res = await search({ data: { segment, city, radiusKm: radius } });
      setResults(res.results as Result[]);
      if (res.mocked) toast.info("Resultados de demonstração (Google Places virá na fase 2).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha");
    } finally {
      setBusy(false);
    }
  }

  async function generateSiteFor(r: Result) {
    if (!user) return;
    setGeneratingId(r.place_id);
    try {
      const { data: site, error } = await supabase
        .from("sites")
        .insert({
          tenant_id: user.id,
          business_name: r.name,
          segment: r.category,
          city,
          address: r.address,
          phone: r.phone,
          google_place_id: r.place_id,
          status: "rascunho",
        })
        .select("id")
        .single();
      if (error || !site) throw new Error(error?.message);
      await generate({ data: { siteId: site.id } });
      toast.success("Site gerado!");
      navigate({ to: "/sites/$id", params: { id: site.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha");
    } finally {
      setGeneratingId(null);
    }
  }

  const filtered = filter === "no_site" ? results.filter((r) => !r.has_website) : results;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearch} className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto]">
          <div>
            <Label htmlFor="seg">Segmento</Label>
            <Input id="seg" value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Dentista" />
          </div>
          <div>
            <Label htmlFor="city">Localização</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo, SP" />
          </div>
          <div>
            <Label htmlFor="r">Raio (km)</Label>
            <Input
              id="r"
              type="number"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) || 5)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </div>
        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSegment(s)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {results.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1 text-sm ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Todos ({results.length})
          </button>
          <button
            onClick={() => setFilter("no_site")}
            className={`rounded-md px-3 py-1 text-sm ${filter === "no_site" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Sem site ({results.filter((r) => !r.has_website).length})
          </button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div key={r.place_id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{r.name}</h3>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  r.has_website ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                }`}
              >
                {r.has_website ? (
                  <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> Com site</span>
                ) : (
                  "Sem site"
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.category}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.address}</p>
            <div className="mt-2 flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span>{r.rating}</span>
              <span className="text-muted-foreground">({r.total_ratings})</span>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full gap-1"
              onClick={() => generateSiteFor(r)}
              disabled={generatingId === r.place_id}
            >
              {generatingId === r.place_id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Gerar Site
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
