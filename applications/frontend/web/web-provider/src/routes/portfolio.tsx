import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Images, Loader2, Plus, Star, Upload } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate } from "@/lib/format";
import { onboardingApi, portfolioApi, type PortfolioItem } from "@/lib/api-client";

const title = "Portfolio — FIXO Provider";
const description = "Showcase completed work with before-and-after photos, categories and project notes.";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PortfolioItem | "new" | null>(null);

  function load() {
    return portfolioApi.list(undefined, 50, 0).then(setItems);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function remove(itemId: string) {
    if (!confirm("Remove this project from your portfolio?")) return;
    await portfolioApi.remove(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    toast.success("Project removed.");
  }

  return (
    <ProviderPage title="Portfolio" subtitle="Work samples customers see on your public profile.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title="Projects"
          action={
            <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="size-4" /> Add project
            </button>
          }
        >
          {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No projects yet. Add your first one.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-2xl bg-muted/50">
                {p.after_image_url ? (
                  <img src={p.after_image_url} alt={p.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    <Images className="size-8 opacity-80" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{p.title}</p>
                    {p.is_featured && <Star className="size-4 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.service_category || "—"} {p.completed_on ? `· ${fmtDate(p.completed_on)}` : ""}
                  </p>
                  <div className="mt-1">
                    <StatusPill tone={p.status === "published" ? "success" : p.status === "archived" ? "destructive" : "muted"} label={p.status} />
                  </div>
                  {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex gap-2 text-xs font-semibold">
                    <button onClick={() => setEditing(p)} className="rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-muted">
                      Edit
                    </button>
                    <button onClick={() => void remove(p.id)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-destructive hover:bg-muted">
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Photo guidelines">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Get the customer's permission before publishing job photos.</li>
            <li>Use before-and-after pairs where possible.</li>
            <li>No faces, addresses, or number plates.</li>
          </ul>
        </Panel>
      </div>

      {editing && (
        <EditModal
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function UploadField({ label, url, onUploaded }: { label: string; url: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await onboardingApi.uploadFile(file);
      onUploaded(uploaded.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center hover:bg-muted/60">
      <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleChange} disabled={uploading} />
      {uploading ? <Loader2 className="size-5 animate-spin text-primary" /> : url ? <Check className="size-5 text-success" /> : <Upload className="size-5 text-primary" />}
      <p className="mt-2 text-xs font-semibold">{url ? `${label} — uploaded` : label}</p>
    </label>
  );
}

function EditModal({ item, onClose, onSaved }: { item: PortfolioItem | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(item?.service_category ?? "");
  const [completedOn, setCompletedOn] = useState(item?.completed_on ?? "");
  const [beforeUrl, setBeforeUrl] = useState(item?.before_image_url ?? "");
  const [afterUrl, setAfterUrl] = useState(item?.after_image_url ?? "");
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description || undefined,
        service_category: category || undefined,
        before_image_url: beforeUrl || undefined,
        after_image_url: afterUrl || undefined,
        completed_on: completedOn || undefined,
        is_featured: isFeatured,
      };
      if (item) await portfolioApi.update(item.id, data);
      else await portfolioApi.create(data);
      toast.success(item ? "Project updated." : "Project added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{item ? "Edit project" : "Add project"}</h2>
        <div className="mt-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Service category" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <input type="date" value={completedOn} onChange={(e) => setCompletedOn(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <div className="grid grid-cols-2 gap-3">
            <UploadField label="Before photo" url={beforeUrl} onUploaded={setBeforeUrl} />
            <UploadField label="After photo" url={afterUrl} onUploaded={setAfterUrl} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Feature this project
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
