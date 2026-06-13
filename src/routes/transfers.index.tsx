import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Archive, Calendar, Plane, MapPin, DollarSign } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/transfers/")({
  component: TransfersIndex,
});

function TransfersIndex() {
  const { transfers, schedules } = useStore();
  const [search, setSearch] = useState("");
  const filtered = transfers.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Transfers"
        subtitle="Airport and point-to-point transfer routes"
        actions={
          <>
            <Input placeholder="Search transfers…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-64" />
            <NewTransferDrawer />
          </>
        }
      />
      <div className="p-8">
        {filtered.length === 0 ? (
          <EmptyState
            title="No transfers yet"
            description="Create a transfer route to start scheduling pickups."
            action={<NewTransferDrawer />}
            icon={<Plane className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const count = schedules.filter((s) => s.kind === "transfer" && s.parentId === t.id).length;
              return (
                <Card key={t.id} className="flex flex-col p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold leading-tight">{t.name}</h3>
                    <span className="rounded-full bg-status-progress/15 px-2 py-0.5 text-[11px] font-medium text-status-progress whitespace-nowrap">
                      {count} scheduled
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> Pickup: {t.pickup}</div>
                    <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> Drop-off: {t.dropoff}</div>
                    <div className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> from ${t.basePrice}</div>
                  </div>
                  <div className="mt-5 flex gap-2 border-t border-border pt-4">
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/transfers/$transferId" params={{ transferId: t.id }}>
                        <Calendar className="h-3.5 w-3.5" /> Schedules
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Edit form opens here")}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Transfer archived")}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
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

function NewTransferDrawer() {
  const { addTransfer } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", pickup: "", dropoff: "", basePrice: "0", notes: "" });

  const submit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    addTransfer({ ...form, basePrice: Number(form.basePrice) || 0 });
    toast.success("Transfer created");
    setOpen(false);
    setForm({ name: "", pickup: "", dropoff: "", basePrice: "0", notes: "" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Create Transfer</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Create Transfer Route</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Route Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Airport → City Center" /></F>
          <F label="Pickup Location"><Input value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })} /></F>
          <F label="Drop-off Location"><Input value={form.dropoff} onChange={(e) => setForm({ ...form, dropoff: e.target.value })} /></F>
          <F label="Base Price (USD)"><Input type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></F>
          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
