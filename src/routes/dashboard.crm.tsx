import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/crm")({
  component: CRMTab,
});

const COLUMNS = [
  { id: "rascunho", label: "Rascunho" },
  { id: "proposta_enviada", label: "Proposta Enviada" },
  { id: "fechado", label: "Fechado" },
  { id: "publicado", label: "Publicado" },
] as const;

type SiteRow = {
  id: string;
  business_name: string;
  segment: string | null;
  setup_price: number | null;
  status: string;
};

function CRMTab() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const { data: sites } = useQuery({
    queryKey: ["crm-sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id,business_name,segment,setup_price,status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SiteRow[];
    },
  });

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = React.useMemo(
    () => (sites ?? []).filter((s) => s.business_name.toLowerCase().includes(search.toLowerCase())),
    [sites, search],
  );

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const overId = String(e.over.id);
    // overId may be a column id
    const newStatus = COLUMNS.find((c) => c.id === overId)?.id;
    if (!newStatus) return;
    qc.setQueryData<SiteRow[]>(["crm-sites"], (prev) =>
      prev?.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    );
    const { error } = await supabase.from("sites").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Falha ao mover: " + error.message);
      qc.invalidateQueries({ queryKey: ["crm-sites"] });
    }
  }

  const proposals = filtered.filter((s) => s.status === "proposta_enviada").length;
  const sold = filtered.filter((s) => s.status === "fechado" || s.status === "publicado").length;
  const revenue = filtered
    .filter((s) => s.status === "fechado" || s.status === "publicado")
    .reduce((sum, s) => sum + Number(s.setup_price ?? 0), 0);
  const conv = filtered.length > 0 ? Math.round((sold / filtered.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Propostas", value: proposals },
          { label: "Receita total", value: `R$ ${revenue.toFixed(2)}` },
          { label: "Clientes", value: sold },
          { label: "Conversão", value: `${conv}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar negócio..."
          className="pl-9"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = filtered.filter((s) => s.status === col.id);
            return (
              <Column key={col.id} id={col.id} label={col.label} items={items} />
            );
          })}
        </div>
        <DragOverlay>
          {activeId ? (
            <KanbanCard site={filtered.find((s) => s.id === activeId)!} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";

function Column({ id, label, items }: { id: string; label: string; items: SiteRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] rounded-xl border bg-card p-3 transition-colors ${isOver ? "border-primary" : "border-border"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{items.length}</span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((s) => (
            <KanbanCard key={s.id} site={s} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ site, dragging }: { site: SiteRow; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: site.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-lg border border-border bg-background p-3 text-sm shadow-sm hover:border-primary ${dragging ? "ring-2 ring-primary" : ""}`}
    >
      <p className="font-medium">{site.business_name}</p>
      <p className="text-xs text-muted-foreground">{site.segment}</p>
      <p className="mt-1 text-xs font-semibold text-primary">R$ {Number(site.setup_price ?? 0).toFixed(2)}</p>
    </div>
  );
}
