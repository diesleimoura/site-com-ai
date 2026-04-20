
User confirmed "Sim" — they want a security scan to verify the backend (RLS policies, exposed data) is properly configured.

This is a research/verification task, not an implementation task — but the scan itself requires the `security--run_security_scan` tool which isn't available in plan mode. So I'll present a short plan to run it.

## Plano: Varredura de segurança do backend

Vou executar uma varredura completa no Lovable Cloud para verificar:

1. **RLS habilitado** em todas as tabelas (`profiles`, `sites`, `proposals`, `prospect_searches`, `subscriptions`, `wallet_transactions`, `withdrawals`)
2. **Políticas RLS** corretamente escopadas por `tenant_id` / `auth.uid()` — sem políticas permissivas demais (`true`, `using (true)`)
3. **Funções `SECURITY DEFINER`** com `search_path` fixo (já vi que `handle_new_user` e `set_updated_at` estão ok)
4. **Linter do Supabase** para pegar avisos automáticos (extensões em schema público, índices faltando, etc.)
5. **Dados sensíveis expostos** sem proteção adequada
6. **Configurações de auth** (proteção contra senhas vazadas / HIBP)

Ao final, te entrego um relatório com:
- ✅ O que está seguro
- ⚠️ Avisos (não-críticos, mas vale ajustar)
- 🔴 Problemas críticos (se houver) + correção sugerida

Se aparecer algo crítico, eu te apresento um plano separado para corrigir antes de aplicar qualquer mudança.
