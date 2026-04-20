import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editSiteFn } from "@/server/sites.functions";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Mude as cores principais para tons de azul",
  "Reescreva o título do hero de forma mais direta",
  "Adicione uma seção de depoimentos",
  "Deixe o rodapé mais minimalista",
];

export function AiChatPanel({
  siteId,
  hasHtml,
  onUpdated,
}: {
  siteId: string;
  hasHtml: boolean;
  onUpdated: () => void;
}) {
  const edit = useServerFn(editSiteFn);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const instruction = text.trim();
    if (instruction.length < 3) return toast.error("Descreva a alteração");
    if (!hasHtml) return toast.error("Site sem HTML para editar");

    setMessages((m) => [...m, { role: "user", content: instruction }]);
    setInput("");
    setBusy(true);
    try {
      await edit({ data: { siteId, instruction } });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "✅ Alteração aplicada. Veja o preview ao lado." },
      ]);
      onUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao aplicar";
      setMessages((m) => [...m, { role: "assistant", content: `❌ ${msg}` }]);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(input);
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium">Editar com IA</h2>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Descreva a alteração desejada e a IA editará seu site.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  disabled={busy}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-6 bg-primary text-primary-foreground"
                : "mr-6 bg-muted text-foreground",
            )}
          >
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {busy && (
          <div className="mr-6 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Aplicando alteração...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ex.: troque o título do hero e use tons de verde..."
            rows={3}
            disabled={busy}
            className="resize-none pr-12"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || input.trim().length < 3}
            className="absolute bottom-2 right-2 h-8 w-8"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </aside>
  );
}
