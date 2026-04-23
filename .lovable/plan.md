

## Atualizar plano do usuário `mouradieslei@gmail.com` para Agência

Vou rodar um UPDATE direto na tabela `profiles` setando `plan = 'agencia'` para o seu email. O plano Agência já tem sites e buscas ilimitados (definidos em `src/lib/plan-limits.ts` como `Infinity`).

### O que será feito

1. **Migration SQL** atualizando seu profile:
   ```sql
   update public.profiles
   set plan = 'agencia',
       plan_expires_at = null,
       searches_used_this_month = 0,
       sites_created_this_month = 0,
       updated_at = now()
   where email = 'mouradieslei@gmail.com';
   ```
   - `plan = 'agencia'` → desbloqueia limites ilimitados
   - `plan_expires_at = null` → sem expiração
   - Zera os contadores de uso do mês para você começar limpo

2. **Verificação** com SELECT confirmando que o registro foi atualizado.

### Observação sobre o build error

O erro `Cannot find module '@dnd-kit/utilities'` em `dashboard.crm.tsx` é de outra tarefa (Kanban do CRM) — não tem relação com esta mudança e não bloqueia a atualização do plano. Posso corrigir em seguida instalando o pacote `@dnd-kit/utilities` (junto com `@dnd-kit/core` e `@dnd-kit/sortable` se ainda não estiverem) num passo separado, se quiser.

### Fora de escopo

- Mudanças de schema, novos campos ou roles administrativas
- Sistema de "admin" para promover outros usuários (hoje a alteração é manual por migration)
- Correção do erro do `@dnd-kit/utilities`

