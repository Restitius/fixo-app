// Root layout — provides AuthProvider to the entire application.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Construction, HelpCircle, Home, RefreshCw, Sparkles, TrafficCone, Wrench } from "lucide-react";
import { I18nextProvider } from "react-i18next";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import i18n from "@/lib/i18n";
import { resolveInitialLanguage, adoptAccountLanguage, isRtl } from "@/lib/language";
import { onboardingApi } from "@/lib/api-client";

// Redirects to the one-time onboarding checklist (Module 03) once, if the
// authenticated customer hasn't completed it yet. Skips auth-flow routes so
// it never fights with login/register/verify-otp navigation.
const SKIP_PATHS = new Set(["/login", "/register", "/verify-otp", "/onboarding"]);

function OnboardingGate() {
  const { access_token, customer } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(false);
  }, [customer?.customer_id]);

  useEffect(() => {
    if (!access_token || !customer || checked || SKIP_PATHS.has(pathname)) return;
    let cancelled = false;
    void onboardingApi
      .status()
      .then((status) => {
        if (cancelled) return;
        setChecked(true);
        if (!status.completed) router.navigate({ to: "/onboarding" });
      })
      .catch(() => setChecked(true));
    return () => {
      cancelled = true;
    };
  }, [access_token, customer, checked, pathname, router]);

  return null;
}

// Adopts the authenticated customer's preferred_language once it loads,
// unless the user already made an explicit in-app choice (see lib/language.ts).
function LanguageAccountSync() {
  const { customer } = useAuth();
  useEffect(() => {
    adoptAccountLanguage(i18n, customer?.preferred_language);
  }, [customer?.preferred_language]);
  return null;
}

// Resolves the initial client-side language and keeps <html lang/dir> in
// sync with every subsequent switch. The server always renders the static
// "en"/"ltr" default from RootShell below — this only patches the DOM after
// hydration, the same way this app's AuthProvider restores state from
// localStorage in a useEffect rather than during the server render.
function DocumentLanguageSync() {
  useEffect(() => {
    const initial = resolveInitialLanguage();
    if (initial !== i18n.language) void i18n.changeLanguage(initial);

    const applyDocumentAttrs = (lng: string) => {
      document.documentElement.lang = lng;
      document.documentElement.dir = isRtl(lng) ? "rtl" : "ltr";
    };
    applyDocumentAttrs(i18n.language);
    i18n.on("languageChanged", applyDocumentAttrs);
    return () => {
      i18n.off("languageChanged", applyDocumentAttrs);
    };
  }, []);
  return null;
}

// Deliberately does not read auth state: this renders exactly when something
// upstream (including auth) may have broken, so it must never depend on the
// context it could itself be recovering from.
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
        <span className="flex size-9 items-center justify-center rounded-xl text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <Wrench className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">FIXO</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="relative flex w-full max-w-xs items-center justify-center rounded-[3rem] bg-primary/5 py-10">
          <Sparkles className="absolute right-8 top-4 size-6 text-primary/50" />
          <div className="w-56 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <span className="size-2 rounded-full bg-white/70" />
              <span className="size-2 rounded-full bg-white/70" />
              <span className="size-2 rounded-full bg-white/70" />
            </div>
            <p className="py-6 text-4xl font-extrabold tracking-tight text-primary">{code}</p>
          </div>
          <Construction className="absolute -bottom-2 -left-3 size-9 text-primary/70" strokeWidth={1.5} />
          <TrafficCone className="absolute -bottom-2 -right-3 size-8 text-primary/70" strokeWidth={1.5} />
        </div>

        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>

        <div className="mt-10 flex w-full max-w-md items-start gap-3 rounded-2xl bg-primary/5 p-4 text-left">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Need help?</p>
            <p className="text-xs text-muted-foreground">If the problem persists, please contact our support team.</p>
          </div>
          <Link to="/help" className="ml-auto shrink-0 self-center whitespace-nowrap text-sm font-semibold text-primary hover:underline">
            Contact Support ›
          </Link>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ onClick, href, icon: Icon, children }: { onClick?: () => void; href?: string; icon: typeof Home; children: ReactNode }) {
  const cls = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]";
  const style = { backgroundImage: "var(--gradient-primary)" };
  if (href) {
    return (
      <a href={href} className={cls} style={style}>
        <Icon className="size-4" /> {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls} style={style}>
      <Icon className="size-4" /> {children}
    </button>
  );
}

function SecondaryButton({ onClick, href, icon: Icon, children }: { onClick?: () => void; href?: string; icon: typeof Home; children: ReactNode }) {
  const cls = "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted";
  if (href) {
    return (
      <Link to={href} className={cls}>
        <Icon className="size-4" /> {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
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
          <SecondaryButton onClick={() => window.history.back()} icon={RefreshCw}>Go Back</SecondaryButton>
          <PrimaryButton href="/" icon={Home}>Go Home</PrimaryButton>
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
      code="404"
      title="Oops! This page didn't load"
      description="Something went wrong on our end. You can try refreshing the page or head back home."
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
          <SecondaryButton href="/" icon={Home}>Go Home</SecondaryButton>
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
      { title: "FIXO — Handyman Services" },
      { name: "description", content: "Book trusted handyman providers and manage your home maintenance." },
      { name: "author", content: "FIXO" },
      { property: "og:title", content: "FIXO — Handyman Services" },
      { property: "og:description", content: "Book trusted handyman providers and manage your home maintenance." },
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
      {
        rel: "stylesheet",
        href: appCss,
      },
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
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <DocumentLanguageSync />
          <LanguageAccountSync />
          <OnboardingGate />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
