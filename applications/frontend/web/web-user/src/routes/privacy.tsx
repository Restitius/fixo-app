import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

const title = "Privacy Policy — FIXO";

const sections: LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    body: (
      <ul className="list-disc space-y-1 pl-6">
        <li>Account details: your name, email address, phone number and language.</li>
        <li>Your addresses, properties, assets and the jobs you request.</li>
        <li>Booking activity: quotes, messages with your provider, arrival and progress updates,
          invoices, ratings and disputes.</li>
        <li>Payment activity: wallet transactions and masked details of saved payment methods.
          We do not store full card numbers.</li>
        <li>Sign-in and device information for your active sessions.</li>
      </ul>
    ),
  },
  {
    id: "why",
    title: "How we use it",
    body: (
      <p>
        To run your bookings, match you with suitable providers, take and refund payments, keep your
        account secure, send the notifications you have enabled and provide support. We do not use
        your data for anything you have not agreed to.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who sees it",
    body: (
      <p>
        The provider you book sees what they need to do the job: your name, the job description, the
        address and messages in the booking. Other customers never see your details. Service
        providers we use to send email and SMS receive only the message and the destination.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <p>
        In Profile → Privacy you can change profile visibility, marketing and data-sharing consent
        and analytics cookies, and you can withdraw optional consent at any time. Notification
        preferences control which alerts you receive and on which channel.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your data rights",
    body: (
      <p>
        You can request a copy of your personal data and ask for your account to be closed from
        Profile → Privacy. Closing an account stops all use of your profile, addresses and saved
        payment methods; bookings, invoices and payment records are retained as required for legal
        and financial purposes.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Passwords are stored hashed, verification codes are single-use and expire, and you can sign
        out of every device from Profile → Security. Contact support straight away if you think
        someone else has accessed your account.
      </p>
    ),
  },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title }, { name: "description", content: "How FIXO handles your personal data." }],
  }),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      updated="28 September 2026"
      intro="This policy describes what personal data FIXO holds, why, who can see it and the choices you have."
      sections={sections}
    />
  ),
});
