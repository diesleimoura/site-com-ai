
## Corrigir bug crítico de login (credenciais na URL)

**Problema:** Form de `/auth` está enviando `email` e `password` como query string na URL em vez de chamar Supabase. Causa: submit nativo do navegador ocorre antes da hidratação React, e o form não tem `method="post"` (defaulta para GET → query string).

**Risco de segurança:** Senha do usuário ficou exposta na URL, no histórico do navegador e potencialmente em logs.

### Correções no `src/routes/auth.tsx`

1. **Adicionar `method="post"` nos `<form>`** — garante que mesmo se o JS falhar em interceptar, o submit nativo não vira GET com credenciais visíveis.
2. **Limpar query string ao montar a página** — se detectar `?email=` ou `?password=` na URL, remover via `window.history.replaceState` imediatamente, antes de qualquer renderização visível, para tirar do histórico do navegador.
3. **Adicionar `noValidate` nos forms** e tratar validação só via Zod (já está), evitando submit nativo do browser em caso de validação HTML5 falhar.

### Recomendação ao usuário

- **Trocar a senha imediatamente** (a senha `1759321755` ficou exposta na URL/histórico). Após o deploy do fix, abrir a tela de login, entrar com a senha atual e usar "esqueci minha senha" para definir uma nova.
- Limpar histórico do navegador para remover a URL com a senha.

### Fora de escopo agora

- Adicionar fluxo de "Esqueci minha senha" (não existe ainda — posso implementar depois se quiser).
- Adicionar login com Google (mencionado nas guidelines, mas é mudança separada).
