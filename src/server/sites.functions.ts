import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPlanLimits } from "@/lib/plan-limits";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
// Haiku é ~5x mais rápido que Sonnet — evita upstream timeout do worker.
const ANTHROPIC_MODEL = "claude-haiku-4-5";

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Limite de requisições da Anthropic atingido. Tente novamente em instantes.");
    if (res.status === 401) throw new Error("Chave Anthropic inválida. Verifique ANTHROPIC_API_KEY.");
    if (res.status === 402 || res.status === 403) throw new Error("Créditos da Anthropic esgotados ou acesso negado.");
    const t = await res.text();
    console.error("Anthropic error", res.status, t);
    throw new Error("Falha na geração com IA (Anthropic)");
  }
  const json = await res.json();
  const content = json.content?.[0]?.text;
  if (!content) throw new Error("Resposta vazia da IA");
  return String(content);
}

function extractHtml(text: string): string {
  // strip markdown fences if present
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  let html = fence ? fence[1] : text;
  html = html.trim();
  // Ensure has <!doctype>
  if (!/<!doctype/i.test(html)) {
    if (!/<html/i.test(html)) {
      html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`;
    } else {
      html = `<!doctype html>${html}`;
    }
  }
  return html;
}

const SYSTEM_GENERATE = `Você é um designer e copywriter sênior especializado em landing pages de alta conversão para pequenos negócios brasileiros. Você sempre devolve um arquivo HTML COMPLETO, autônomo, com CSS embutido em uma única tag <style> no <head>. NUNCA use JavaScript. NUNCA use frameworks. NUNCA importe fontes externas (use system-ui). O HTML deve ser totalmente responsivo (mobile first) e usar uma paleta moderna combinando com o segmento. Estrutura obrigatória do <body>:
1. Header simples com nome do negócio
2. Hero com título forte, subtítulo, CTA grande "Falar no WhatsApp" (link wa.me)
3. Seção "Nossos Serviços" com 3 cards
4. Seção "Sobre nós" curta
5. Seção "Depoimentos" com 2 depoimentos fictícios mas plausíveis
6. Footer com endereço, telefone e copyright
Devolva APENAS o HTML, sem explicações, sem markdown.`;

const SYSTEM_EDIT = `Você é um editor de HTML. Recebe um HTML completo e uma instrução. Devolve o HTML COMPLETO atualizado conforme a instrução, mantendo a estrutura, CSS embutido e responsividade. Devolva APENAS o HTML, sem explicações, sem markdown.`;

export const generateSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      siteId: z.string().uuid(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Plan-limit gating
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, sites_created_this_month")
      .eq("id", userId)
      .single();
    const limits = getPlanLimits(profile?.plan);
    const used = profile?.sites_created_this_month ?? 0;
    if (used >= limits.sites) {
      throw new Error(`PLAN_LIMIT_SITES:${used}:${limits.sites}:${profile?.plan ?? "free"}`);
    }

    const { data: site, error } = await supabase
      .from("sites")
      .select("*")
      .eq("id", data.siteId)
      .eq("tenant_id", userId)
      .single();
    if (error || !site) throw new Error("Site não encontrado");

    const userPrompt = `Negócio: ${site.business_name}
Segmento: ${site.segment ?? "Geral"}
Cidade: ${site.city ?? "Brasil"}
Endereço: ${site.address ?? "—"}
Telefone/WhatsApp: ${site.phone ?? site.whatsapp ?? "(não informado)"}

Crie a landing page completa.`;

    const raw = await callAI(SYSTEM_GENERATE, userPrompt);
    const html = extractHtml(raw);

    const { error: upErr } = await supabase
      .from("sites")
      .update({ html_content: html })
      .eq("id", data.siteId)
      .eq("tenant_id", userId);
    if (upErr) throw new Error(upErr.message);

    await supabase
      .from("profiles")
      .update({ sites_created_this_month: used + 1 })
      .eq("id", userId);

    return { ok: true };
  });

export const editSiteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      siteId: z.string().uuid(),
      instruction: z.string().min(3).max(2000),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: site, error } = await supabase
      .from("sites")
      .select("html_content, ai_edits_count")
      .eq("id", data.siteId)
      .eq("tenant_id", userId)
      .single();
    if (error || !site || !site.html_content) throw new Error("Site sem HTML para editar");

    const userPrompt = `INSTRUÇÃO:\n${data.instruction}\n\nHTML ATUAL:\n${site.html_content}`;
    const raw = await callAI(SYSTEM_EDIT, userPrompt);
    const html = extractHtml(raw);

    const { error: upErr } = await supabase
      .from("sites")
      .update({ html_content: html, ai_edits_count: (site.ai_edits_count ?? 0) + 1 })
      .eq("id", data.siteId)
      .eq("tenant_id", userId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
