import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  Mail,
  Phone,
  Calendar,
  Pencil,
  Check,
  Plus,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";

const title = "Profile & Settings — HandyDeck";
const description =
  "Manage your account, addresses, payment methods and notification preferences.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const tabs = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "payments", label: "Payment Methods", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const addresses = [
  { label: "Home", address: "12 Riverside Ave, Apt 4B", city: "Nairobi, Kenya", default: true },
  { label: "Office", address: "45 Mombasa Road, Suite 12", city: "Nairobi, Kenya", default: false },
];

const payments = [
  { type: "Visa", last4: "4242", expiry: "12/28", default: true },
  { type: "Mastercard", last4: "8888", expiry: "09/26", default: false },
];

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <PageShell title="Profile & Settings" subtitle="Manage your account and preferences">
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-fit rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                FA
              </span>
              <button className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Pencil className="size-3.5" />
              </button>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Ferra Alexandra</h3>
            <p className="text-sm text-muted-foreground">ferra.alex@email.com</p>
            <span className="mt-3 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              Premium Member
            </span>
          </div>

          <nav className="mt-6 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-primary-foreground"
                    : "text-foreground/80 hover:bg-sidebar-accent"
                }`}
                style={activeTab === tab.id ? { backgroundImage: "var(--gradient-primary)" } : undefined}
              >
                <tab.icon className="size-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <button className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium">
                  <Pencil className="size-4" />
                  Edit
                </button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full Name" value="Ferra Alexandra" icon={User} />
                <Field label="Email" value="ferra.alex@email.com" icon={Mail} />
                <Field label="Phone" value="+254 712 345 678" icon={Phone} />
                <Field label="Member Since" value="March 2024" icon={Calendar} />
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Addresses</h3>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <Plus className="size-4" />
                  Add Address
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.label}
                    className="rounded-2xl border border-border p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{addr.label}</span>
                      {addr.default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <Check className="size-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{addr.address}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <Plus className="size-4" />
                  Add Card
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {payments.map((card) => (
                  <div
                    key={card.last4}
                    className="rounded-2xl border border-border p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{card.type} •••• {card.last4}</span>
                      {card.default && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
              <div className="space-y-4">
                <ToggleRow label="Booking confirmations" defaultOn />
                <ToggleRow label="Provider messages" defaultOn />
                <ToggleRow label="Promotions and offers" />
                <ToggleRow label="Payment reminders" defaultOn />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                  </div>
                  <button className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium">Change</button>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <button className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border p-4">
      <span className="font-medium">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition-transform ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
