import { createFileRoute } from "@tanstack/react-router";
import { ProspectSearch } from "@/components/dashboard/ProspectSearch";

export const Route = createFileRoute("/dashboard/prospectar")({
  component: ProspectarTab,
});

function ProspectarTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Prospectar empresas</h2>
        <p className="text-sm text-muted-foreground">
          Encontre empresas locais e gere o site com IA num clique.
        </p>
      </div>
      <ProspectSearch />
    </div>
  );
}
