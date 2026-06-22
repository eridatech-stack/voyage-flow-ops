import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Archive, Edit, Calendar, MapPin, Clock, DollarSign, Loader2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTours, useCreateTour, useUpdateTour, useArchiveTour } from "@/hooks/useTours";
import { useCurrency } from "@/hooks/useCurrency";
import { useScheduledTours } from "@/hooks/useSchedules";

export const Route = createFileRoute("/tours/")({
  component: ToursIndex,
});

function ToursIndex() {
  const { data: tours = [], isLoading } = useTours();
  const { format } = useCurrency();
  const { data: allSchedules = [] } = useScheduledTours();
  const [search, setSearch] = useState("");

  const filtered = tours.filter(
    (t) => t.is_active && t.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <TourDrawer mode="create" />
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
            title="No tours yet"
            description="Create your first tour template to start scheduling departures."
            action={<TourDrawer mode="create" />}
            icon={<MapPin className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const count = allSchedules.filter((s) => s.tour_id === t.id).length;
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
                    {t.destination && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {t.destination}</div>}
                    {t.duration && <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {t.duration}</div>}
                    <div className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> from {format(t.base_price)}</div>
                  </div>
                  <div className="mt-5 flex gap-2 border-t border-border pt-4">
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/tours/$tourId" params={{ tourId: t.id }}>
                        <Calendar className="h-3.5 w-3.5" /> Schedules
                      </Link>
                    </Button>
                    <TourDrawer mode="edit" tour={t} />
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

// ── Tour Drawer (create + edit) ─────────────────────────────────────────────

type TourForm = {
  name: string;
  description: string;
  duration: string;
  destination: string;
  base_price: string;
  is_active: boolean;
};

const emptyForm: TourForm = {
  name: "", description: "", duration: "", destination: "", base_price: "0", is_active: true,
};

function TourDrawer({
  mode,
  tour,
}: {
  mode: "create" | "edit";
  tour?: { id: string; name: string; description: string | null; duration: string | null; destination: string | null; base_price: number; is_active: boolean };
}) {
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TourForm>(
    tour
      ? {
          name: tour.name,
          description: tour.description ?? "",
          duration: tour.duration ?? "",
          destination: tour.destination ?? "",
          base_price: String(tour.base_price),
          is_active: tour.is_active,
        }
      : emptyForm
  );

  const submit = async () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      duration: form.duration || null,
      destination: form.destination || null,
      base_price: Number(form.base_price) || 0,
      is_active: form.is_active,
    };
    if (mode === "create") {
      await createTour.mutateAsync(payload);
    } else if (tour) {
      await updateTour.mutateAsync({ id: tour.id, ...payload });
    }
    setOpen(false);
    if (mode === "create") setForm(emptyForm);
  };

  const isPending = createTour.isPending || updateTour.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === "create" ? (
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Create New Tour</Button>
        ) : (
          <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /></Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Create New Tour" : "Edit Tour"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Tour Name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </F>
          <F label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Duration"><Input placeholder="e.g. 4 hours" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></F>
            <F label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></F>
          </div>
          <F label="Base Price (USD)">
            <Input type="number" min={0} value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Create Tour" : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ArchiveButton({ id }: { id: string }) {
  const archive = useArchiveTour();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => archive.mutate(id)}
      disabled={archive.isPending}
      title="Archive tour"
    >
      {archive.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
    </Button>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
