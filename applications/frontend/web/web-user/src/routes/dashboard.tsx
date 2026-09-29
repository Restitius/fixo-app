import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth-context";
import { CustomerQuickHome } from "@/routes/index";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Customer dashboard — FIXO" }] }),
  component: CustomerDashboardPage,
});

function CustomerDashboardPage() {
  const { customer, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!customer) return <Navigate to="/login" replace />;

  return <CustomerQuickHome customerName={customer.full_name} onLogout={logout} />;
}
