// /register is kept so existing links and landing-page CTAs keep working;
// the sign-up form itself lives at /register-customer.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    throw redirect({ to: "/register-customer", replace: true });
  },
});
