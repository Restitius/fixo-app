// Properties (Module 06) + Property Assets tab (Module 32, simplified).
// Assets are backed by the generic /assets domain, which has no property_id
// linkage and also exposes finance concepts (sell/revalue) that don't apply
// to a home appliance — both are disclosed honestly in the UI rather than
// hidden, per the product decision for this module.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  Boxes,
  Building2,
  Calendar,
  Car,
  DoorOpen,
  Home as HomeIcon,
  Info,
  Landmark,
  Pencil,
  Plus,
  Sofa,
  Trash2,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { propertiesApi, assetsApi, type PropertyRow, type PropertyRoom, type AssetRow } from "@/lib/api-client";
import { fmtDate, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/properties")({
  component: PropertiesPage,
});

const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "CONDO", "OFFICE", "OTHER"] as const;
const ROOM_TYPES = ["BEDROOM", "BATHROOM", "KITCHEN", "LIVING_ROOM", "OTHER"] as const;
const ASSET_TYPES = ["REAL_ESTATE", "VEHICLE", "EQUIPMENT", "OTHER"] as const;
const CURRENCIES = ["TZS", "USD", "KES", "EUR"] as const;

function propertyTypeIcon(type: string) {
  switch (type) {
    case "HOUSE":
      return HomeIcon;
    case "APARTMENT":
    case "CONDO":
      return Building2;
    case "OFFICE":
      return Landmark;
    default:
      return Boxes;
  }
}

function roomTypeIcon(type: string) {
  switch (type) {
    case "BEDROOM":
      return BedDouble;
    case "BATHROOM":
      return Bath;
    case "KITCHEN":
      return UtensilsCrossed;
    case "LIVING_ROOM":
      return Sofa;
    default:
      return DoorOpen;
  }
}

function assetTypeIcon(type: string) {
  switch (type) {
    case "REAL_ESTATE":
      return HomeIcon;
    case "VEHICLE":
      return Car;
    case "EQUIPMENT":
      return Wrench;
    default:
      return Boxes;
  }
}

function PropertiesPage() {
  const { t } = useTranslation("properties");
  const { access_token, loading, logout, customer } = useAuth();

  const [properties, setProperties] = useState<PropertyRow[] | null>(null);
  const [assets, setAssets] = useState<AssetRow[] | null>(null);

  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyRow | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<PropertyRow | null>(null);
  const [detailProperty, setDetailProperty] = useState<PropertyRow | null>(null);

  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRow | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<AssetRow | null>(null);

  const loadProperties = useCallback(() => {
    void propertiesApi.list().then(setProperties).catch(() => setProperties((p) => p ?? []));
  }, []);
  const loadAssets = useCallback(() => {
    void assetsApi.list().then(setAssets).catch(() => setAssets((a) => a ?? []));
  }, []);

  useEffect(() => {
    if (access_token && !loading) {
      loadProperties();
      loadAssets();
    }
  }, [access_token, loading, loadProperties, loadAssets]);

  // Keep an open detail sheet in sync after room add/remove or a property edit.
  useEffect(() => {
    if (!detailProperty || !properties) return;
    const fresh = properties.find((p) => p.property_id === detailProperty.property_id);
    if (fresh) setDetailProperty(fresh);
  }, [properties, detailProperty]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const totalRooms = (properties ?? []).reduce((s, p) => s + (p.rooms?.length ?? 0), 0);

  async function deleteProperty(p: PropertyRow) {
    try {
      await propertiesApi.remove(p.property_id);
      toast.success(t("properties.deleted"));
      setDeletingProperty(null);
      if (detailProperty?.property_id === p.property_id) setDetailProperty(null);
      loadProperties();
    } catch {
      // toast already emitted by api client
    }
  }

  async function deleteAsset(a: AssetRow) {
    try {
      await assetsApi.remove(a.asset_id);
      toast.success(t("assets.deleted"));
      setDeletingAsset(null);
      loadAssets();
    } catch {
      // toast already emitted by api client
    }
  }

  return (
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={HomeIcon} label={t("metrics.totalProperties")} hint={t("metrics.onFile")} value={String((properties ?? []).length)} />
        <MetricCard icon={DoorOpen} label={t("metrics.totalRooms")} hint={t("metrics.acrossProperties")} value={String(totalRooms)} tone="success" />
        <MetricCard icon={Boxes} label={t("metrics.totalAssets")} hint={t("metrics.homeItems")} value={String((assets ?? []).length)} tone="amber" />
      </div>

      <Tabs defaultValue="properties" className="mt-6">
        <TabsList>
          <TabsTrigger value="properties">{t("tabs.properties")}</TabsTrigger>
          <TabsTrigger value="assets">{t("tabs.assets")}</TabsTrigger>
        </TabsList>

        <TabsContent value="properties">
          <div className="mt-4 flex items-center justify-end">
            <Button className="gap-2" onClick={() => setAddPropertyOpen(true)}>
              <Plus className="size-4" /> {t("properties.add")}
            </Button>
          </div>

          {properties === null ? (
            <div className="mt-4 h-64 animate-pulse rounded-3xl bg-muted/60" />
          ) : properties.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={HomeIcon}
                title={t("properties.emptyTitle")}
                description={t("properties.emptyDescription")}
                actionLabel={t("properties.add")}
                onAction={() => setAddPropertyOpen(true)}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => {
                const Icon = propertyTypeIcon(p.property_type);
                const roomCount = p.rooms?.length ?? 0;
                return (
                  <div
                    key={p.property_id}
                    className="flex cursor-pointer flex-col gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                    onClick={() => setDetailProperty(p)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProperty(p);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title={t("properties.edit")}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingProperty(p);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title={t("properties.delete")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{t(`properties.types.${p.property_type}`, { defaultValue: p.property_type })}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {p.bedrooms != null && (
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="size-4" /> {t("properties.bedroomsCount", { count: p.bedrooms })}
                        </span>
                      )}
                      {p.bathrooms != null && (
                        <span className="flex items-center gap-1.5">
                          <Bath className="size-4" /> {t("properties.bathroomsCount", { count: p.bathrooms })}
                        </span>
                      )}
                      {p.year_built != null && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-4" /> {p.year_built}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary">
                      <DoorOpen className="size-4" />
                      {t("properties.roomCount", { count: roomCount })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assets">
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t("assets.notLinkedNote")}
          </div>

          <div className="mt-3 flex items-center justify-end">
            <Button className="gap-2" onClick={() => setAddAssetOpen(true)}>
              <Plus className="size-4" /> {t("assets.add")}
            </Button>
          </div>

          {assets === null ? (
            <div className="mt-4 h-64 animate-pulse rounded-3xl bg-muted/60" />
          ) : assets.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Boxes}
                title={t("assets.emptyTitle")}
                description={t("assets.emptyDescription")}
                actionLabel={t("assets.add")}
                onAction={() => setAddAssetOpen(true)}
              />
            </div>
          ) : (
            <TableCard>
              <TableScroll minWidth={760}>
                <TableHead
                  columns={[
                    t("assets.columns.name"),
                    t("assets.columns.type"),
                    t("assets.columns.purchaseValue"),
                    t("assets.columns.purchasedAt"),
                    t("assets.columns.notes"),
                    t("assets.columns.actions"),
                  ]}
                />
                <tbody>
                  {assets.map((a) => {
                    const Icon = assetTypeIcon(a.asset_type);
                    return (
                      <tr key={a.asset_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon className="size-4" />
                            </span>
                            <p className="font-semibold">{a.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{t(`assets.types.${a.asset_type}`, { defaultValue: a.asset_type })}</td>
                        <td className="px-4 py-4">{fmtMoney(a.purchase_value, a.currency)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{a.purchased_at ? fmtDate(a.purchased_at) : "—"}</td>
                        <td className="max-w-[220px] truncate px-4 py-4 text-muted-foreground">{a.notes || "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingAsset(a)}
                              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={t("assets.edit")}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => setDeletingAsset(a)}
                              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title={t("assets.delete")}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableScroll>
            </TableCard>
          )}
        </TabsContent>
      </Tabs>

      <PropertyFormDialog
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onSaved={loadProperties}
      />
      <PropertyFormDialog
        open={!!editingProperty}
        onOpenChange={(v) => !v && setEditingProperty(null)}
        property={editingProperty}
        onSaved={() => {
          loadProperties();
          setEditingProperty(null);
        }}
      />
      <PropertyDetailSheet
        property={detailProperty}
        onOpenChange={(o) => !o && setDetailProperty(null)}
        onRoomsChanged={loadProperties}
      />
      <AlertDialog open={!!deletingProperty} onOpenChange={(v) => !v && setDeletingProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("properties.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("properties.deleteConfirmDescription", { name: deletingProperty?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("properties.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingProperty && void deleteProperty(deletingProperty)}
            >
              {t("properties.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssetFormDialog open={addAssetOpen} onOpenChange={setAddAssetOpen} onSaved={loadAssets} />
      <AssetFormDialog
        open={!!editingAsset}
        onOpenChange={(v) => !v && setEditingAsset(null)}
        asset={editingAsset}
        onSaved={() => {
          loadAssets();
          setEditingAsset(null);
        }}
      />
      <AlertDialog open={!!deletingAsset} onOpenChange={(v) => !v && setDeletingAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("assets.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("assets.deleteConfirmDescription", { name: deletingAsset?.name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("assets.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingAsset && void deleteAsset(deletingAsset)}
            >
              {t("assets.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property?: PropertyRow | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation("properties");
  const isEdit = !!property;
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState<string>("HOUSE");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(property?.name ?? "");
      setPropertyType(property?.property_type ?? "HOUSE");
      setBedrooms(property?.bedrooms != null ? String(property.bedrooms) : "");
      setBathrooms(property?.bathrooms != null ? String(property.bathrooms) : "");
      setYearBuilt(property?.year_built != null ? String(property.year_built) : "");
      setNotes(property?.notes ?? "");
    }
  }, [open, property]);

  async function save() {
    if (!name.trim()) {
      toast.error(t("properties.fillRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        property_type: propertyType,
        bedrooms: bedrooms.trim() ? Number(bedrooms) : null,
        bathrooms: bathrooms.trim() ? Number(bathrooms) : null,
        year_built: yearBuilt.trim() ? Number(yearBuilt) : null,
        notes: notes.trim() || null,
      };
      if (isEdit && property) {
        await propertiesApi.update(property.property_id, payload);
        toast.success(t("properties.updated"));
      } else {
        await propertiesApi.create(payload);
        toast.success(t("properties.created"));
      }
      onOpenChange(false);
      onSaved();
    } catch {
      // toast already emitted by api client
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("properties.editTitle") : t("properties.addTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("properties.nameLabel")}</Label>
            <Input placeholder={t("properties.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("properties.typeLabel")}</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>{t(`properties.types.${v}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("properties.yearBuiltLabel")}</Label>
            <Input type="number" inputMode="numeric" placeholder={t("properties.yearBuiltPlaceholder")} value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("properties.bedroomsLabel")}</Label>
            <Input type="number" min="0" inputMode="numeric" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("properties.bathroomsLabel")}</Label>
            <Input type="number" min="0" inputMode="numeric" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("properties.notesLabel")}</Label>
            <Textarea placeholder={t("properties.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("properties.cancel")}</Button>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? t("properties.saving") : t("properties.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyDetailSheet({
  property,
  onOpenChange,
  onRoomsChanged,
}: {
  property: PropertyRow | null;
  onOpenChange: (open: boolean) => void;
  onRoomsChanged: () => void;
}) {
  const { t } = useTranslation("properties");
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<string>("BEDROOM");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setRoomName("");
    setRoomType("BEDROOM");
  }, [property?.property_id]);

  async function addRoom() {
    if (!property) return;
    if (!roomName.trim()) {
      toast.error(t("rooms.fillRequired"));
      return;
    }
    setAdding(true);
    try {
      await propertiesApi.addRoom(property.property_id, { room_type: roomType, name: roomName.trim() });
      toast.success(t("rooms.added"));
      setRoomName("");
      onRoomsChanged();
    } catch {
      // toast already emitted by api client
    } finally {
      setAdding(false);
    }
  }

  async function removeRoom(room: PropertyRoom) {
    setRemovingId(room.room_id);
    try {
      await propertiesApi.removeRoom(room.room_id);
      toast.success(t("rooms.removed"));
      onRoomsChanged();
    } catch {
      // toast already emitted by api client
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Sheet open={!!property} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{property?.name}</SheetTitle>
        </SheetHeader>
        {property && (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("properties.typeLabel")}</p>
                <p className="font-medium">{t(`properties.types.${property.property_type}`, { defaultValue: property.property_type })}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("properties.yearBuiltLabel")}</p>
                <p className="font-medium">{property.year_built ?? "—"}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("properties.bedroomsLabel")}</p>
                <p className="font-medium">{property.bedrooms ?? "—"}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("properties.bathroomsLabel")}</p>
                <p className="font-medium">{property.bathrooms ?? "—"}</p>
              </div>
            </div>

            {property.notes && (
              <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{property.notes}</p>
            )}

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("rooms.title")}</h4>
              {!property.rooms || property.rooms.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {t("rooms.emptyDescription")}
                </p>
              ) : (
                <div className="space-y-2">
                  {property.rooms.map((room) => {
                    const Icon = roomTypeIcon(room.room_type);
                    return (
                      <div key={room.room_id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{room.name}</p>
                            <p className="text-xs text-muted-foreground">{t(`rooms.types.${room.room_type}`, { defaultValue: room.room_type })}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => void removeRoom(room)}
                          disabled={removingId === room.room_id}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          title={t("rooms.remove")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-muted/50 p-3">
                <div className="min-w-[140px] flex-1 space-y-1">
                  <Label className="text-xs">{t("rooms.nameLabel")}</Label>
                  <Input placeholder={t("rooms.namePlaceholder")} value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                </div>
                <div className="w-36 space-y-1">
                  <Label className="text-xs">{t("rooms.typeLabel")}</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((v) => (
                        <SelectItem key={v} value={v}>{t(`rooms.types.${v}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" disabled={adding} onClick={() => void addRoom()} className="gap-1.5">
                  <Plus className="size-4" /> {adding ? t("rooms.adding") : t("rooms.add")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AssetFormDialog({
  open,
  onOpenChange,
  asset,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset?: AssetRow | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation("properties");
  const isEdit = !!asset;
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<string>("EQUIPMENT");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [currency, setCurrency] = useState<string>("TZS");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(asset?.name ?? "");
      setAssetType(asset?.asset_type ?? "EQUIPMENT");
      setPurchaseValue(asset?.purchase_value != null ? String(asset.purchase_value) : "");
      setCurrency(asset?.currency ?? "TZS");
      setPurchasedAt(asset?.purchased_at ? asset.purchased_at.slice(0, 10) : "");
      setNotes(asset?.notes ?? "");
    }
  }, [open, asset]);

  async function save() {
    if (!name.trim()) {
      toast.error(t("assets.fillRequired"));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && asset) {
        // Backend only allows editing name/notes on an existing asset.
        await assetsApi.update(asset.asset_id, {
          name: name.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
        toast.success(t("assets.updated"));
      } else {
        await assetsApi.create({
          name: name.trim(),
          asset_type: assetType,
          ...(purchaseValue.trim() ? { purchase_value: Number(purchaseValue) } : {}),
          currency,
          purchased_at: purchasedAt || null,
          notes: notes.trim() || null,
        });
        toast.success(t("assets.created"));
      }
      onOpenChange(false);
      onSaved();
    } catch {
      // toast already emitted by api client
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("assets.editTitle") : t("assets.addTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("assets.nameLabel")}</Label>
            <Input placeholder={t("assets.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("assets.typeLabel")}</Label>
            <Select value={assetType} onValueChange={setAssetType} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>{t(`assets.types.${v}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("assets.purchasedAtLabel")}</Label>
            <Input type="date" value={purchasedAt} disabled={isEdit} onChange={(e) => setPurchasedAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("assets.purchaseValueLabel")}</Label>
            <Input type="number" min="0" step="0.01" inputMode="decimal" disabled={isEdit} value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("assets.currencyLabel")}</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={isEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("assets.notesLabel")}</Label>
            <Textarea placeholder={t("assets.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        {isEdit && <p className="text-xs text-muted-foreground">{t("assets.editLimitedNote")}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("assets.cancel")}</Button>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? t("assets.saving") : t("assets.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
