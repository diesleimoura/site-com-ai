import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

function randomToken(len = 20) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function getProposalAccessClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const authorization = getRequestHeader("authorization");

  if (!supabaseUrl || !publishableKey || !authorization?.startsWith("Bearer ")) {
    return null;
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

export const getPublicProposalFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(8).max(64).regex(/^[a-z0-9]+$/),
    }).parse,
  )
  .handler(async ({ data }) => {
    const db = getProposalAccessClient();
    if (!db) return null;

    const { data: prop, error } = await db
      .from("proposals")
      .select("token,setup_price,monthly_price,client_name,client_email,client_phone,payment_status,site_id")
      .eq("token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!prop) return null;

    const { data: site, error: siteError } = await db
      .from("sites")
      .select("business_name,segment,city,html_content")
      .eq("id", prop.site_id)
      .maybeSingle();

    if (siteError) throw new Error(siteError.message);

    await db.from("proposals").update({ status: "viewed" }).eq("token", data.token);

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
    const db = getProposalAccessClient();
    if (!db) throw new Error("Configuração de backend indisponível neste ambiente");

    const { error } = await db
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
