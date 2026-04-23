

## Manter o progresso em tempo real durante fases longas

A tela `/sites/$id/gerando` já tem barra, círculo e checklist ligados ao `site_generation_jobs` via Realtime + polling. O problema é que entre os checkpoints do servidor (10 → 30 → 55 → 90) a fase "writing" demora 20-40s chamando o Claude Sonnet, e a barra fica parada nos 54% porque o interpolador atual sobe 1% a cada 600ms até `nextCheckpoint - 1` e depois congela. Vou tornar o avanço contínuo, com desaceleração logarítmica, para nunca travar.

### Mudanças

**1. `src/routes/sites.$id.gerando.tsx` — interpolador resiliente**

- **Avanço contínuo sem teto rígido**: substituir o limite "trava em `nextCheckpoint - 1`" por uma curva que desacelera conforme se aproxima do alvo, mas nunca para. Fórmula: a cada tick (400ms), `displayProgress += max(0.15, (target - displayProgress) * 0.04)` onde `target = nextCheckpoint(job.progress)`. Isso garante que a barra sempre se mexe (mínimo 0.15%/tick ≈ 0.4%/s) e nunca ultrapassa o checkpoint real, snapando quando o servidor confirma a próxima etapa.
- **ETA por fase**: cada etapa tem duração estimada (analyzing 3s, designing 5s, writing 35s, finalizing 5s). Quando a fase muda, registrar `phaseStartedAt` e usar como base de cálculo para a velocidade — fases longas sobem mais devagar, fases curtas mais rápido, mas todas mantêm movimento visível.
- **Heartbeat de "ainda processando"**: se passar >15s sem atualização do servidor durante `writing`, trocar a caption para "Escrevendo os textos… (gerando com Claude Sonnet, isso pode levar até 1 min)" para reforçar que está vivo.
- **Watchdog de timeout**: se o job ficar `running` por mais de 3 minutos sem mudar de step, mostrar um aviso discreto "A geração está demorando mais que o normal" com botão "Tentar novamente" (que leva ao `/dashboard/prospectar`). Não cancela o job.
- **Reforço do Realtime**: aumentar a frequência do polling de fallback de 3s para 2s e logar no console quando o canal Realtime conectar/desconectar, para diagnóstico futuro.
- Manter círculo, checklist, captions, redirect ao completar e tela de falha exatamente como estão.

**2. Sem mudanças de backend**
Os checkpoints (10/30/55/90/100) e a tabela `site_generation_jobs` continuam iguais. Toda a melhoria é client-side.

### Detalhes técnicos

```ts
// pseudo
const TICK_MS = 400;
const MIN_STEP = 0.15;
const EASE = 0.04;

useEffect(() => {
  if (!job || job.status !== "running") return;
  const id = setInterval(() => {
    setDisplayProgress((prev) => {
      const target = nextCheckpoint(job.progress);
      if (prev >= target) return prev;
      const delta = Math.max(MIN_STEP, (target - prev) * EASE);
      return Math.min(prev + delta, target - 0.05);
    });
  }, TICK_MS);
  return () => clearInterval(id);
}, [job]);
```

### Arquivos tocados
- `src/routes/sites.$id.gerando.tsx` (edit)

