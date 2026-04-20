
Voltando para a refatoração do editor. Já tenho o contexto: as imagens mostram um editor com toolbar superior (Salvar, Gerar Link, Publicar Site, SEO, Domínio, Versões, Equipe, Config, toggle mobile/desktop) e painel de chat IA lateral à direita.

As 3 perguntas anteriores não foram respondidas. Vou propor o caminho mais sensato (MVP) sem re-perguntar — o usuário pode ajustar.

## Plano: novo layout do editor `/sites/$id`

**Escopo (MVP do editor):**
1. **Toolbar superior** com todos os botões do mockup
2. **Preview central** com toggle mobile/desktop
3. **Chat IA lateral** persistente à direita (substitui o modal atual)
4. **Salvar / Publicar / Gerar Link** funcionais; demais botões viram placeholders ("em breve")

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ ← Voltar  [Salvar] [Gerar Link] [Publicar] [SEO]...      │ toolbar
├────────────────────────────────────────┬─────────────────┤
│                                        │  Chat IA        │
│   [📱 Mobile] [🖥 Desktop]             │  ─────────────  │
│   ┌──────────────────────────────┐     │  Mensagens...   │
│   │   iframe preview             │     │                 │
│   │                              │     │                 │
│   └──────────────────────────────┘     │  [input] [↑]    │
└────────────────────────────────────────┴─────────────────┘
```

### Arquivos a editar

- **`src/routes/sites.$id.tsx`** — refatorar completamente:
  - Toolbar com botões (lucide icons: Save, Link, Globe, Search, Globe2, History, Users, Settings)
  - Toggle viewport: `desktop` (100% largura) / `mobile` (375px centralizado)
  - Layout em grid: `flex-1` para preview + sidebar fixa de ~380px à direita
  - Substituir `EditModal` por `<AiChatPanel>` inline
  - Manter `ProposalModal` acessível via botão na toolbar

- **Novo componente `src/components/site-editor/AiChatPanel.tsx`**:
  - Estado local de mensagens (`{role, content}[]`) — sem persistência (sessão apenas)
  - Input + botão enviar; chama `editSiteFn` existente
  - Renderiza histórico com `react-markdown` (já vou adicionar dependência se faltar)
  - Loading state com spinner; após sucesso, invalida query do site para re-renderizar iframe
  - Sugestões de prompt iniciais ("Mude as cores para azul", "Reescreva o hero", etc.)

- **Novo componente `src/components/site-editor/EditorToolbar.tsx`**:
  - Botões: Salvar (toast: já é automático), Gerar Link (copia URL pública para clipboard), Publicar Site (placeholder toast "em breve"), SEO/Domínio/Versões/Equipe/Config (placeholders)
  - Botão "Criar Proposta" mantém modal atual

- **Novo componente `src/components/site-editor/ViewportToggle.tsx`**:
  - Dois botões (Smartphone/Monitor) controlando estado `viewport: 'mobile' | 'desktop'`
  - Mobile: iframe com `max-width: 375px` centralizado e `h-[80vh]`
  - Desktop: iframe full width

### Comportamento dos botões funcionais

- **Salvar**: toast informando que salvamento é automático após cada edição via IA
- **Gerar Link**: gera URL `https://{slug}.sitesai.app` e copia via `navigator.clipboard`
- **Publicar Site**: placeholder por ora (toast "em breve") — implementação real exigiria coluna `published` na tabela `sites`

### Fora de escopo (placeholders)

SEO, Domínio personalizado, Versões/histórico, Equipe, Config, edição manual de elementos, seleção visual de blocos, "corrigir erros".

### Detalhes técnicos

- Sem mudanças de banco de dados.
- Sem novas server functions — reusa `editSiteFn` existente.
- `react-markdown` já não está no projeto; vou adicionar.
- Manter `sandbox="allow-same-origin"` no iframe.
- Layout responsivo: em telas <1024px, chat vira drawer (Sheet) acessível via botão.
