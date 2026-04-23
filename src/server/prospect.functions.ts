import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPlanLimits } from "@/lib/plan-limits";

type ProspectResult = {
  place_id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  total_ratings: number;
  has_website: boolean;
  phone: string;
};

// Deterministic mock fallback used only when SERPAPI_KEY is missing.
function mockResults(segment: string, city: string, count = 12): ProspectResult[] {
  const base = `${segment}-${city}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  const rand = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 0xffffffff;
  };
  const names = [
    "Premium", "Center", "Express", "Family", "Pro", "Master", "Elite", "Top", "Smart", "Vida",
    "Bem-Estar", "Estrela", "Sol", "Luz", "Dourada",
  ];
  const streets = ["Rua das Flores", "Av. Brasil", "Rua XV de Novembro", "Av. Paulista", "Rua do Comércio"];
  return Array.from({ length: count }).map((_, i) => {
    const hasSite = rand() > 0.65;
    const ratingRaw = 3.5 + rand() * 1.5;
    return {
      place_id: `mock_${base}_${i}`,
      name: `${segment} ${names[Math.floor(rand() * names.length)]} ${i + 1}`,
      category: segment,
      address: `${streets[Math.floor(rand() * streets.length)]}, ${100 + Math.floor(rand() * 900)} — ${city}`,
      rating: Math.round(ratingRaw * 10) / 10,
      total_ratings: Math.floor(rand() * 200) + 5,
      has_website: hasSite,
      phone: `(11) 9${Math.floor(rand() * 9000 + 1000)}-${Math.floor(rand() * 9000 + 1000)}`,
    };
  });
}

type SerpLocalResult = {
  position?: number;
  title?: string;
  place_id?: string;
  data_id?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  types?: string[];
  address?: string;
  phone?: string;
  website?: string;
  links?: { website?: string };
};

async function serpApiSearch(
  segment: string,
  city: string,
  apiKey: string,
): Promise<ProspectResult[]> {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: `${segment} em ${city}`,
    type: "search",
    google_domain: "google.com.br",
    hl: "pt-br",
    gl: "br",
    api_key: apiKey,
  });
  const url = `https://serpapi.com/search.json?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SERPAPI_HTTP_${res.status}:${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { local_results?: SerpLocalResult[]; error?: string };
  if (json.error) throw new Error(`SERPAPI_ERROR:${json.error}`);
  const list = json.local_results ?? [];
  return list.slice(0, 20).map((r, i) => {
    const website = r.website ?? r.links?.website ?? "";
    return {
      place_id: r.place_id ?? r.data_id ?? `serp_${i}`,
      name: r.title ?? "Sem nome",
      category: r.type ?? r.types?.[0] ?? segment,
      address: r.address ?? "",
      rating: typeof r.rating === "number" ? r.rating : 0,
      total_ratings: typeof r.reviews === "number" ? r.reviews : 0,
      has_website: Boolean(website),
      phone: r.phone ?? "",
    };
  });
}

export const prospectSearchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      segment: z.string().min(2).max(80),
      city: z.string().min(2).max(80),
      radiusKm: z.number().min(1).max(50),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Plan-limit gating
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, searches_used_this_month")
      .eq("id", userId)
      .single();
    const limits = getPlanLimits(profile?.plan);
    const used = profile?.searches_used_this_month ?? 0;
    if (used >= limits.searches) {
      throw new Error(`PLAN_LIMIT_SEARCHES:${used}:${limits.searches}:${profile?.plan ?? "free"}`);
    }

    const apiKey = process.env.SERPAPI_KEY;
    let results: ProspectResult[];
    let mocked = false;

    if (apiKey) {
      try {
        results = await serpApiSearch(data.segment, data.city, apiKey);
        if (results.length === 0) {
          results = mockResults(data.segment, data.city);
          mocked = true;
        }
      } catch (err) {
        console.error("SerpApi failed, falling back to mock:", err);
        results = mockResults(data.segment, data.city);
        mocked = true;
      }
    } else {
      results = mockResults(data.segment, data.city);
      mocked = true;
    }

    await supabase.from("prospect_searches").insert({
      tenant_id: userId,
      segment: data.segment,
      city: data.city,
      radius_km: data.radiusKm,
      results_cache: results,
      cache_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    await supabase
      .from("profiles")
      .update({ searches_used_this_month: used + 1 })
      .eq("id", userId);

    return { results, mocked };
  });
