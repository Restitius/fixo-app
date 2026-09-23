import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import type { SystemMessage } from "@/lib/api-client";

interface Props {
  message: SystemMessage;
  onAction?: () => void;
}

export function SystemMessageCard({ message, onAction }: Props) {
  const Icon = message.type === "success" ? CheckCircle2 : message.type === "warning" ? TriangleAlert : message.type === "info" ? Info : AlertCircle;
  return (
    <section role="alert" data-message-id={message.id ?? undefined} className="mx-auto w-full rounded-[1.75rem] border bg-card px-6 py-7 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-7" /></div>
      <h2 className="mt-4 text-lg font-bold text-foreground">{message.title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{message.body}</p>
      {message.action && onAction && <button type="button" onClick={onAction} className="mt-5 min-w-36 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">{message.action.label}</button>}
    </section>
  );
}
