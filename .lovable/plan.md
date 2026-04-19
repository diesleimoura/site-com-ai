
O usuário quer transformar a `/turbo` em uma tela de upsell/paywall que destaque os planos pagos (Pro e Agência) ao invés de mostrar a busca de prospecção diretamente.

## Mudanças propostas

**1. Reescrever `src/routes/turbo.tsx`** como página de upgrade:

- Header igual (voltar p/ Dashboard + título "Modo Turbo")
- Hero: "Desbloqueie o Modo Turbo" com explicação curta
- Comparativo lado-a-lado de 3 planos (reaproveitando o estilo de `/planos`):
  - **Grátis (atual)**: 2 sites/mês, 1 busca, sem publicação — botão desabilitado "Plano atual"
  - **Pro — R$ 89,90/mês**: 80 sites, 10 buscas Turbo, publicação, domínio próprio — destacado
  - **Agência — R$ 299/mês** (atualizar de R$ 249): sites ilimitados, 20 buscas Turbo, tudo do Pro — badge "Melhor custo"
- Seção "O que você ganha com o Turbo": 3-4 cards com ícones (busca em massa, filtros avançados, geração ilimitada, exportar leads)
- CTA final: "Já tenho plano" → link p/ `/dashboard/cobranca`
- Botões "Assinar" disparam `toast.info("Pagamentos chegam em breve")` por enquanto (sem Mercado Pago ainda)

**2. Atualizar `src/routes/planos.tsx`** para refletir o novo preço da Agência (R$ 299).

**3. Não mexer em `/dashboard/prospectar`** — continua sendo onde a busca real acontece (com limite de 1 busca/mês no plano grátis, lógica fica para depois).

## Detalhes técnicos

- Componentes: `Button`, `Card` (inline), ícones `lucide-react` (Zap, Check, Sparkles, Crown, Rocket)
- Sem novas tabelas/server functions — é página estática de marketing
- Layout responsivo: `grid md:grid-cols-3` para os planos
- Manter dark theme do dashboard

## Fora de escopo (próximas fases)
- Integração real de pagamento (Mercado Pago/Stripe) — fica para quando o usuário aprovar
- Lógica de feature-gating por plano nas outras telas
