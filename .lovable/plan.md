

## Plano: adicionar Login com Google em `/auth`

Lovable Cloud tem suporte nativo e gerenciado para Google OAuth — não precisa de credenciais do usuário, nem configuração no Google Cloud Console. As credenciais gerenciadas funcionam imediatamente e podem ser substituídas depois pelas suas próprias (em Cloud → Users → Authentication Settings → Google) se quiser branding próprio.

### Passos

1. **Configurar o provedor Google** via ferramenta de Configure Social Login. Isso vai:
   - Instalar o pacote `@lovable.dev/cloud-auth-js`
   - Gerar o módulo `src/integrations/lovable/` (gerenciado automaticamente — não edito manualmente)

2. **Atualizar `src/routes/auth.tsx`**:
   - Adicionar um botão **"Continuar com Google"** acima do form (visível tanto na aba "Entrar" quanto "Criar conta") com um separador "ou" entre o botão e os campos de email/senha
   - Usar ícone do Google (SVG inline com cores oficiais — não usar lucide pois não tem o "G" colorido)
   - Handler chama:
     ```ts
     const result = await lovable.auth.signInWithOAuth("google", {
       redirect_uri: `${window.location.origin}/dashboard/sites`,
     });
     if (result.error) toast.error(result.error.message);
     // se result.redirected → browser redireciona, nada a fazer
     ```
   - Estado de loading no botão durante o redirect
   - Manter todo o fluxo email/senha existente intacto (incluindo as correções de segurança recentes)

### Layout do botão

```
┌─────────────────────────────────┐
│  [G] Continuar com Google       │  (variant outline, full width)
└─────────────────────────────────┘
─────────── ou ───────────
[ Email ]
[ Senha ]
[ Entrar ]
```

### Fora de escopo

- Configurar credenciais próprias do Google (BYOK) — usar gerenciado por padrão; usuário pode trocar depois pela UI do Cloud
- Apple, GitHub e outros provedores
- Fluxo de "Esqueci minha senha"

