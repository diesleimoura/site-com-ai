
## Status

The end-to-end test based on logs is **passing**:

- Server function `getPublicProposalFn` returns 200 with full payload (proposal token, prices, site HTML)
- The previous "Proposta não encontrada" runtime error is no longer thrown — the handler now returns data successfully
- Client component conditions: `isLoading` → `error || !data` → render. Since data is present and no error, the main layout (header + preview iframe + investment card + lead form) renders

No code changes are needed. The fix from the previous turn (try/catch + `.maybeSingle()` + auth-header fallback client) resolved the issue.

## Recommended verification (manual, by user)

Since I'm in read-only mode and the user is currently viewing `/proposta/lcdsbg0hhw3cq3ae3tkc9t3u` in the preview:

1. Confirm the proposal page renders with: header ("Proposta SitesAI" + WhatsApp button), site preview iframe (Dentista Luz 1), investment card (R$ 497,00 + R$ 49,00/mês), and the lead form
2. Fill the lead form (name/email/WhatsApp), pick PIX, click "Gerar PIX" → expect a success toast
3. Test the invalid-token path: navigate to `/proposta/invalidtoken123` → expect the "Proposta não encontrada" empty state (not a crash)

If anything looks off visually, share a screenshot and I'll patch it.
