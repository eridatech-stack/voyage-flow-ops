import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Archive, Edit, Calendar, MapPin, Clock, DollarSign } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/tours/")({
  component: ToursIndex,
});

function ToursIndex() {
  const { tours, schedules } = useStore();
  const [search, setSearch] = useState("");
  const filtered = tours.filter((t) => !t.archived && t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Tours"
        subtitle="Manage your tour catalog and scheduled departures"
        actions={
          <>
            <Input
              placeholder="Search tours…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64"
            />
            <NewTourDrawer />
          </>
        }
      />
      <div className="p-8">
        {filtered.length === 0 ? (
          <EmptyState
            title="No tours yet"
            description="Create your first tour template to start scheduling departures."
            action={<NewTourDrawer />}
            icon={<MapPin className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const count = schedules.filter((s) => s.kind === "tour" && s.parentId === t.id).length;
              return (
                <Card key={t.id} className="group flex flex-col p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold leading-tight">{t.name}</h3>
                    <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-medium text-amber whitespace-nowrap">
                      {count} scheduled
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {t.destination}</div>
                    <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {t.duration}</div>
                    <div className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> from ${t.basePrice}</div>
                  </div>
                  <div className="mt-5 flex gap-2 border-t border-border pt-4">
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/tours/$tourId" params={{ tourId: t.id }}>
                        <Calendar className="h-3.5 w-3.5" /> Schedules
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Edit form opens here")}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Tour archived")}>
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

function NewTourDrawer() {
  const { addTour } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", duration: "", destination: "", basePrice: "0", included: "", notes: "" });

  const submit = () => {
    if (!form.name) { toast.error("Tour name is required"); return; }
    addTour({ ...form, basePrice: Number(form.basePrice) || 0 });
    toast.success("Tour created");
    setOpen(false);
    setForm({ name: "", description: "", duration: "", destination: "", basePrice: "0", included: "", notes: "" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Create New Tour</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Create New Tour</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Tour Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
          <F label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Duration"><Input placeholder="e.g. 4 hours" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></F>
            <F label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></F>
          </div>
          <F label="Base Price (USD)"><Input type="number" min={0} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></F>
          <F label="Included Services"><Textarea rows={2} placeholder="Guide, transport, lunch…" value={form.included} onChange={(e) => setForm({ ...form, included: e.target.value })} /></F>
          <F label="Internal Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create Tour</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
