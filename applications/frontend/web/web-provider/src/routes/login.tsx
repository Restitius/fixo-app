import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Wrench } from "lucide-react";

import { useProviderAuth } from "@/lib/provider-auth";

const title = "Provider Sign In — FIXO";
const description = "Sign in to your FIXO provider workspace to manage requests, jobs, earnings and payouts.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useProviderAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="mt-5 rounded-[2rem] bg-card p-7 shadow-[var(--shadow-card)]">
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Wrench className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your FIXO provider workspace.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to FIXO?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create a provider account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
