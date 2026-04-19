import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader, DashboardTabs } from "@/components/dashboard/DashboardHeader";
import { StatsCards, PlanCards } from "@/components/dashboard/StatsAndPlans";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <StatsCards />
        <PlanCards />
      </div>
      <DashboardTabs />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
