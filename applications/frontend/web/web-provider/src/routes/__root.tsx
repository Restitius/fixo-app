// Root layout — provides the mock provider session to the whole app.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Home, RefreshCw, Wrench, HelpCircle } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ProviderAuthProvider } from "@/lib/provider-auth";

function ErrorPageChrome({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-xl text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Wrench className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">FIXO Provider</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="w-56 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <span className="size-2 rounded-full bg-white/70" />
            <span className="size-2 rounded-full bg-white/70" />
            <span className="size-2 rounded-full bg-white/70" />
          </div>
          <p className="py-6 text-4xl font-extrabold tracking-tight text-primary">{code}</p>
        </div>

        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>

        <div className="mt-10 flex w-full max-w-md items-start gap-3 rounded-2xl bg-primary/5 p-4 text-left">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Need help?</p>
            <p className="text-xs text-muted-foreground">Contact provider support if the problem persists.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ onClick, href, icon: Icon, children }: { onClick?: () => void; href?: string; icon: typeof Home; children: ReactNode }) {
  const cls =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]";
  const style = { backgroundImage: "var(--gradient-primary)" };
  if (href) {
    return (
      <Link to={href} className={cls} style={style}>
        <Icon className="size-4" /> {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} style={style}>
      <Icon className="size-4" /> {children}
    </button>
  );
}

function SecondaryButton({ onClick, icon: Icon, children }: { onClick?: () => void; icon: typeof Home; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
    >
      <Icon className="size-4" /> {children}
    </button>
  );
}

function NotFoundComponent() {
  return (
    <ErrorPageChrome
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      actions={
        <>
          <SecondaryButton onClick={() => window.history.back()} icon={RefreshCw}>
            Go Back
          </SecondaryButton>
          <PrimaryButton href="/" icon={Home}>
            Go Home
          </PrimaryButton>
        </>
      }
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ErrorPageChrome
      code="500"
      title="Oops! This page didn't load"
      description="Something went wrong on our end. Try refreshing the page or head back home."
      actions={
        <>
          <PrimaryButton
            onClick={() => {
              router.invalidate();
              reset();
            }}
            icon={RefreshCw}
          >
            Try Again
          </PrimaryButton>
          <SecondaryButton onClick={() => window.history.back()} icon={Home}>
            Go Back
          </SecondaryButton>
        </>
      }
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FIXO Provider" },
      { name: "description", content: "Run your service business on FIXO." },
      { name: "author", content: "FIXO" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderAuthProvider>
        {/* Required: nested routes render here. */}
        <Outlet />
      </ProviderAuthProvider>
    </QueryClientProvider>
  );
}
