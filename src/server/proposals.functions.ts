import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function randomToken(len = 20) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export const createProposalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      siteId: z.string().uuid(),
      setupPrice: z.number().min(0).max(99999),
      monthlyPrice: z.number().min(0).max(99999),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = randomToken(24);
    const { data: prop, error } = await supabase
      .from("proposals")
      .insert({
        site_id: data.siteId,
        tenant_id: userId,
        token,
        setup_price: data.setupPrice,
        monthly_price: data.monthlyPrice,
        status: "sent",
      })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    await supabase
      .from("sites")
      .update({ status: "proposta_enviada", setup_price: data.setupPrice, monthly_price: data.monthlyPrice })
      .eq("id", data.siteId)
      .eq("tenant_id", userId);
    return { token: prop.token };
  });

// Public — no auth needed. Uses service-role and filters strictly by token.
export const getPublicProposalFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(8).max(64).regex(/^[a-z0-9]+$/),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { data: prop, error } = await supabaseAdmin
      .from("proposals")
      .select("token,setup_price,monthly_price,client_name,client_email,client_phone,payment_status,site_id")
      .eq("token", data.token)
      .single();
    if (error || !prop) throw new Error("Proposta não encontrada");
    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("business_name,segment,city,html_content")
      .eq("id", prop.site_id)
      .single();
    // Mark as viewed
    await supabaseAdmin.from("proposals").update({ status: "viewed" }).eq("token", data.token);
    return {
      proposal: {
        token: prop.token,
        setup_price: prop.setup_price,
        monthly_price: prop.monthly_price,
        payment_status: prop.payment_status,
      },
      site: site ?? null,
    };
  });

export const submitProposalLeadFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(8).max(64).regex(/^[a-z0-9]+$/),
      name: z.string().min(1).max(120),
      email: z.string().email().max(255),
      phone: z.string().min(8).max(30),
      method: z.enum(["pix", "card"]),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("proposals")
      .update({
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone,
        payment_method: data.method,
      })
      .eq("token", data.token);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
