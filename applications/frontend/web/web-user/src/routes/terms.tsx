import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

const title = "Terms of Use — FIXO";

const sections: LegalSection[] = [
  {
    id: "using-fixo",
    title: "Using FIXO",
    body: (
      <>
        <p>
          FIXO connects customers with independent home-service professionals (“providers”). FIXO
          is the marketplace; the work itself is carried out by the provider you choose.
        </p>
        <p>
          You need an account to request a service. You must give accurate details, keep your
          password private and verify your email address and phone number. You are responsible for
          activity on your account.
        </p>
      </>
    ),
  },
  {
    id: "requests-quotes",
    title: "Requests, quotes and bookings",
    body: (
      <>
        <p>
          You describe the job, and FIXO shows matching providers with an instant estimate or a
          quote. A quote stays valid for the period shown on it. Choosing a provider and accepting
          their quote creates a booking at the agreed price.
        </p>
        <p>
          If the provider finds extra work on site, they must propose it as a change request. The
          price only changes if you approve it in the app.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <>
        <p>
          The agreed amount is the full price of the job and includes VAT. When you confirm a
          booking, the amount is reserved (from your FIXO wallet, or held on another payment
          method). You are charged only after the provider marks the job complete and you confirm
          it.
        </p>
        <p>
          If the final price differs from the reserved amount because you approved extra work, the
          difference is charged or returned when you confirm completion. You receive an invoice for
          every completed job.
        </p>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations and refunds",
    body: (
      <>
        <p>You can cancel a booking from the app. The fee depends on how much notice you give:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>72 hours or more before the visit: no fee.</li>
          <li>Under 72 hours: 10% of the agreed price.</li>
          <li>Under 24 hours: 20% of the agreed price.</li>
          <li>Under 2 hours: 40% of the agreed price.</li>
        </ul>
        <p>
          The rest of the reserved amount is refunded. Refunds to your FIXO wallet are credited
          immediately.
        </p>
      </>
    ),
  },
  {
    id: "on-site",
    title: "On the day of the visit",
    body: (
      <p>
        Your booking has a private arrival code. Share it with the provider only when they arrive,
        so both sides can confirm the visit. You can follow the provider’s progress and message
        them from the booking.
      </p>
    ),
  },
  {
    id: "warranty-disputes",
    title: "Warranty and disputes",
    body: (
      <>
        <p>
          Completed jobs are covered by a warranty for parts and labour for 90 days. Report an
          issue within 60 days of completion from the Warranties page.
        </p>
        <p>
          If something went wrong, open a dispute from the booking with a description and evidence.
          FIXO reviews it and you can withdraw it at any time before it is resolved.
        </p>
      </>
    ),
  },
  {
    id: "wallet-rewards",
    title: "Wallet, promotions and rewards",
    body: (
      <p>
        Wallet credit comes from refunds, promotions, referrals and loyalty rewards; it cannot be
        topped up directly. Loyalty points are earned automatically when a booking is completed.
        Promotions have their own conditions and expiry dates, shown with the offer.
      </p>
    ),
  },
  {
    id: "closing",
    title: "Closing your account",
    body: (
      <p>
        You can close your account from Profile → Privacy. You must finish or cancel bookings in
        progress and resolve open disputes first. Bookings, invoices and payment records are kept
        for legal and financial reasons after closure.
      </p>
    ),
  },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title }, { name: "description", content: "The terms for using FIXO as a customer." }],
  }),
  component: () => (
    <LegalPage
      title="Terms of Use"
      updated="28 September 2026"
      intro="These terms explain how booking and paying for home services works on FIXO. By creating an account you agree to them."
      sections={sections}
    />
  ),
});
