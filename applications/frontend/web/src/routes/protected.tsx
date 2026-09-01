// Protected route wrapper — redirects unauthenticated users to login.
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/protected")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { access_token, loading, logout, customer } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!access_token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <span className="font-medium">
            {customer?.full_name ?? "Authenticated"}
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
