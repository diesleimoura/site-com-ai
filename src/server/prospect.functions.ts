import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Deterministic mock prospect search. Will be replaced by Google Places in Phase 2.
function mockResults(segment: string, city: string, count = 12) {
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
    const results = mockResults(data.segment, data.city);
    await supabase.from("prospect_searches").insert({
      tenant_id: userId,
      segment: data.segment,
      city: data.city,
      radius_km: data.radiusKm,
      results_cache: results,
      cache_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    return { results, mocked: true };
  });
