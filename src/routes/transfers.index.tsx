import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Archive, Calendar, Plane, MapPin, DollarSign, Loader2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTransfers, useCreateTransfer, useUpdateTransfer, useArchiveTransfer } from "@/hooks/useTransfers";
import { useCurrency } from "@/hooks/useCurrency";
import { useScheduledTransfers } from "@/hooks/useSchedules";
import type { Transfer } from "@/hooks/useTransfers";

export const Route = createFileRoute("/transfers/")({
  component: TransfersIndex,
});

function TransfersIndex() {
  const { data: transfers = [], isLoading } = useTransfers();
  const { format } = useCurrency();
  const { data: allSchedules = [] } = useScheduledTransfers();
  const [search, setSearch] = useState("");

  const filtered = transfers.filter(
    (t) => t.is_active && t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Transfers"
        subtitle="Airport and point-to-point transfer routes"
        actions={
          <>
            <Input
              placeholder="Search transfers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64"
            />
            <TransferDrawer mode="create" />
          </>
        }
      />
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No transfer routes yet"
            description="Create a transfer route to start scheduling pickups and drop-offs."
            action={<TransferDrawer mode="create" />}
            icon={<Plane className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const count = allSchedules.filter((s) => s.transfer_id === t.id).length;
              return (
                <Card key={t.id} className="group flex flex-col p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold leading-tight">{t.name}</h3>
                    <span className="rounded-full bg-status-progress/15 px-2 py-0.5 text-[11px] font-medium text-status-progress whitespace-nowrap">
                      {count} scheduled
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {t.origin && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>From: {t.origin}</span>
                      </div>
                    )}
                    {t.destination && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>To: {t.destination}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" /> from {format(t.base_price)}
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2 border-t border-border pt-4">
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/transfers/$transferId" params={{ transferId: t.id }}>
                        <Calendar className="h-3.5 w-3.5" /> Schedules
                      </Link>
                    </Button>
                    <TransferDrawer mode="edit" transfer={t} />
                    <ArchiveButton id={t.id} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Transfer Drawer ─────────────────────────────────────────────────────────

type TransferForm = {
  name: string;
  origin: string;
  destination: string;
  base_price: string;
};

const emptyForm: TransferForm = { name: "", origin: "", destination: "", base_price: "0" };

function TransferDrawer({ mode, transfer }: { mode: "create" | "edit"; transfer?: Transfer }) {
  const create = useCreateTransfer();
  const update = useUpdateTransfer();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TransferForm>(
    transfer
      ? {
          name: transfer.name,
          origin: transfer.origin ?? "",
          destination: transfer.destination ?? "",
          base_price: String(transfer.base_price),
        }
      : emptyForm
  );

  const submit = async () => {
    const payload = {
      name: form.name,
      origin: form.origin || null,
      destination: form.destination || null,
      base_price: Number(form.base_price) || 0,
      is_active: true,
    };
    if (mode === "create") await create.mutateAsync(payload);
    else if (transfer) await update.mutateAsync({ id: transfer.id, ...payload });
    setOpen(false);
    if (mode === "create") setForm(emptyForm);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === "create" ? (
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Create Transfer</Button>
        ) : (
          <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /></Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Create Transfer Route" : "Edit Transfer Route"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Route Name *">
            <Input
              placeholder="e.g. Zvartnots Airport → City Center"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </F>
          <F label="Pickup / Origin">
            <Input
              placeholder="e.g. Zvartnots International Airport"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            />
          </F>
          <F label="Drop-off / Destination">
            <Input
              placeholder="e.g. Yerevan City Center"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
          </F>
          <F label="Base Price (USD)">
            <Input
              type="number"
              min={0}
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            />
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Create Route" : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ArchiveButton({ id }: { id: string }) {
  const archive = useArchiveTransfer();
  return (
    <Button
      size="sm" variant="outline"
      onClick={() => archive.mutate(id)}
      disabled={archive.isPending}
      title="Archive route"
    >
      {archive.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
    </Button>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
