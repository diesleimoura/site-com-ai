import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Limite de requisições atingido. Tente em alguns segundos.");
    if (res.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos no workspace.");
    const t = await res.text();
    console.error("AI gateway error", res.status, t);
    throw new Error("Falha na geração com IA");
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
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
