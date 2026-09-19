// Client-side gate for the provider workspace. The session is mock/localStorage
// only, so the check runs after hydration and sends guests to /login.
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { PageShell } from "./PageShell";
import { useProviderAuth } from "@/lib/provider-auth";

export function ProviderPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { session, loading } = useProviderAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <PageShell title={title} {...(subtitle ? { subtitle } : {})}>
      {children}
    </PageShell>
  );
}
