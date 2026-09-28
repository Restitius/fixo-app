import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fixoSdk, type ClosurePreview } from "@/lib/api-client";
import { fmtMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("profile");
  const { logout } = useAuth();
  const [preview, setPreview] = useState<ClosurePreview | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setPreview(null);
    void fixoSdk
      .closurePreview()
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [open]);

  async function confirm() {
    setBusy(true);
    try {
      await fixoSdk.requestAccountClosure(password);
      toast.success(
        t("privacy.deleteScheduled", {
          defaultValue: "Your account has been closed. You have been signed out.",
        }),
      );
      onOpenChange(false);
      await logout();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : t("privacy.deleteFailed", { defaultValue: "Could not close the account." }),
      );
    } finally {
      setBusy(false);
    }
  }

  const rows: Array<[string, string]> = preview
    ? [
        [t("privacy.deleteActiveBookings", { defaultValue: "Bookings in progress" }), String(preview.active_bookings)],
        [t("privacy.deletePendingPayments", { defaultValue: "Pending payments" }), String(preview.pending_payments)],
        [t("privacy.deleteOpenDisputes", { defaultValue: "Open disputes" }), String(preview.open_disputes)],
        [t("privacy.deleteActiveWarranties", { defaultValue: "Active warranties" }), String(preview.active_warranties)],
        [t("privacy.deleteWalletBalance", { defaultValue: "Wallet balance" }), fmtMoney(preview.wallet_balance, "TZS")],
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {t("privacy.deleteTitle", { defaultValue: "Delete your account" })}
          </DialogTitle>
          <DialogDescription>
            {t("privacy.deleteIntro", {
              defaultValue: "You will be signed out everywhere and will no longer be able to log in.",
            })}
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <p className="text-sm text-muted-foreground">
            {t("privacy.deleteLoading", { defaultValue: "Checking your account…" })}
          </p>
        ) : (
          <div className="space-y-4">
            <ul className="divide-y divide-border rounded-2xl border border-border text-sm">
              {rows.map(([label, value]) => (
                <li key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </li>
              ))}
            </ul>
            {preview.blockers.length > 0 && (
              <div role="alert" className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                {preview.blockers.map((b) => (
                  <p key={b}>{b}</p>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{preview.retained_data}</p>
            {preview.can_close && (
              <div className="space-y-1.5">
                <Label htmlFor="delete-password">
                  {t("privacy.deletePassword", { defaultValue: "Enter your password to confirm" })}
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t("privacy.deleteCancel", { defaultValue: "Keep my account" })}
              </Button>
              <Button
                variant="destructive"
                disabled={busy || !preview.can_close || password.length < 1}
                onClick={() => void confirm()}
              >
                {busy
                  ? t("privacy.deleting", { defaultValue: "Closing…" })
                  : t("privacy.deleteConfirm", { defaultValue: "Delete account" })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
