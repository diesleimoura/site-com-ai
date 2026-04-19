
O projeto é grande demais para uma única entrega. Vou propor um MVP em fases. Esta primeira fase entrega a base sólida (auth, dashboard, geração de sites com IA, preview e propostas públicas) — o suficiente para você usar o produto end-to-end. Prospecção real, pagamentos e demais abas vêm em fases seguintes.

## Fase 1 — MVP (esta entrega)

**Inclui:**
- Auth (email/senha) + onboarding com slug
- Dashboard dark theme (#0d1117) com header, stats e abas
- Aba **Sites**: listar, criar via IA, preview em iframe, editar via IA, deletar
- Aba **Prospectar**: UI completa com **dados mock** (Google Places fica para Fase 2)
- Geração de site via **Lovable AI Gateway** (Gemini, sem API key)
- **Propostas**: configurar valores, gerar token, página pública `/proposta/:token`
- Aba **CRM** (Kanban com @dnd-kit), **Conta** (slug, email)
- Abas placeholder: Vendas, Carteira, Afiliados, Cobrança, Logos
- Modo Turbo (página separada com mesmo fluxo de prospecção mock)

**Stack ajustada à plataforma:**
- TanStack Start (não React Router v6 — não é suportado aqui)
- Lovable Cloud (Supabase gerenciado) para auth, DB e RLS
- Lovable AI Gateway no lugar de chamada direta à Anthropic (sem custo de chave, modelo `google/gemini-2.5-flash`)
- Server Functions do TanStack Start (não Edge Functions Supabase)
- Tailwind v4 com tokens semânticos no `styles.css` (dark por padrão)

## Fase 2 (próximas mensagens, se aprovar Fase 1)
- Google Places + Geocoding reais (você fornece chaves)
- Mercado Pago: `create-payment` (PIX/cartão) + `mp-webhook` + carteira/saques
- Aba Afiliados funcional, Cobrança com plano Pro, Logos SVG auto-gerados

---

## Arquitetura Fase 1

**Rotas (`src/routes/`):**
```text
__root.tsx              shell + QueryClient + AuthProvider
index.tsx               landing → redireciona para /auth ou /dashboard
auth.tsx                login/cadastro
onboarding.tsx          definir slug
dashboard.tsx           layout com header + tabs (Outlet)
  dashboard.sites.tsx
  dashboard.vendas.tsx
  dashboard.prospectar.tsx
  dashboard.crm.tsx
  dashboard.carteira.tsx
  dashboard.afiliados.tsx
  dashboard.cobranca.tsx
  dashboard.logos.tsx
  dashboard.conta.tsx
turbo.tsx               modo turbo standalone
sites.$id.tsx           preview do site + ações
proposta.$token.tsx     pública (light theme), sem auth
planos.tsx
```

**Tabelas (Lovable Cloud, todas com RLS `tenant_id = auth.uid()`):**
`profiles`, `sites`, `proposals`, `subscriptions`, `wallet_transactions`, `withdrawals`, `prospect_searches` — schema conforme spec original. Trigger `handle_new_user` cria profile com slug e `affiliate_code` aleatórios.

**Server Functions:**
- `generateSite` — chama Lovable AI com prompt estruturado, retorna HTML completo, salva em `sites.html_content`
- `editSite` — recebe HTML + instrução, retorna HTML editado
- `prospectSearch` — Fase 1 retorna mock determinístico baseado em segmento/cidade; Fase 2 chama Google
- `createProposal` — gera token único, persiste, retorna URL pública

**Design tokens (em `styles.css`):**
```text
--background: #0d1117 → oklch
--card:       #161b22 → oklch
--border:     #30363d → oklch
--primary:    #2563eb → oklch (azul)
--success:    verde para WhatsApp/saque
fonte: Inter via Google Fonts no __root head
```

**Componentes-chave:**
- `DashboardHeader` (logo, botão WhatsApp verde, Turbo, email, logout)
- `StatsCards` (4 cards) e `PlanCards` (Free/Pro lado a lado)
- `TabsNav` horizontal (shadcn Tabs)
- `SiteGenerationModal` com 4 passos animados
- `SitePreview` (browser fake + iframe)
- `KanbanBoard` (@dnd-kit/sortable, 4 colunas)
- `ProspectGrid` com pills de segmentos

**Dependências a adicionar:** `@dnd-kit/core`, `@dnd-kit/sortable`, `zod` (já existe via shadcn), Inter via `<link>` no head.

**Segurança:**
- RLS em todas as tabelas
- Página `/proposta/:token` pública usa server function que busca apenas pelo token (sem expor tenant_id)
- Validação Zod em todos os inputs server-side

## Perguntas antes de implementar

1. **Confirma seguir só com Fase 1?** (auth + sites IA + propostas + CRM + UI mock de prospecção)
2. **OK usar Lovable AI Gateway** (Gemini, sem chave, créditos inclusos) em vez de Anthropic direta?
3. **Página pública de proposta**: manter layout claro (light) como na spec, mesmo com o app inteiro em dark?
4. **Logo do header**: tenho logo/nome do produto a usar ou crio um placeholder ("SitesAI")?
