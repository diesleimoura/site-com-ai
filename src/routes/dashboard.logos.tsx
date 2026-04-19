import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/logos")({
  component: LogosTab,
});

function colorFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 55%)`;
}

function LogosTab() {
  const { data: sites } = useQuery({
    queryKey: ["logos-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id,business_name").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Logos gerados</h2>
      {!sites?.length ? (
        <p className="text-sm text-muted-foreground">Nenhum site ainda — crie um para gerar o logo automaticamente.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sites.map((s) => {
            const initial = (s.business_name?.[0] ?? "?").toUpperCase();
            const color = colorFromName(s.business_name);
            return (
              <div key={s.id} className="flex flex-col items-center rounded-xl border border-border bg-card p-5">
                <svg viewBox="0 0 100 100" className="h-24 w-24">
                  <rect width="100" height="100" rx="20" fill={color} />
                  <text
                    x="50"
                    y="65"
                    fontFamily="Inter,sans-serif"
                    fontWeight="800"
                    fontSize="50"
                    textAnchor="middle"
                    fill="white"
                  >
                    {initial}
                  </text>
                </svg>
                <p className="mt-3 text-center text-sm font-medium">{s.business_name}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
