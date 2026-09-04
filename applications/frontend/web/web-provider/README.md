# FIXO Provider Web App

Provider-facing web application for the FIXO handyman marketplace.

Covers the full provider journey: public "Become a Provider" portal, registration
and OTP verification, guided 7-step onboarding, profile & business profile,
identity verification, services & pricing, service areas, availability, and the
provider command center (dashboard, requests, quotes, bookings, calendar,
messages, customers, wallet, earnings, payouts, reviews, performance, team,
documents, support, settings).

Design system is shared with `web-user` (same tokens in `src/styles.css`,
same shell/sidebar/card patterns).

Data is currently **mock data** in `src/lib/mock-data.ts` — no backend calls.

```bash
bun install
bun run dev
```
