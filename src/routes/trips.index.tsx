import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus, Edit, Trash2, Loader2, Route, Calendar,
  Clock, MapPin, Car, User, Users, ChevronRight,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip, type Trip } from "@/hooks/useTrips";
import { useVehicles, useDrivers } from "@/hooks/useFleet";
import { useCurrency } from "@/hooks/useCurrency";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/trips/")({
  component: TripsIndex,
});

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

function TripsIndex() {
  const { data: trips = [], isLoading } = useTrips();
  const { format } = useCurrency();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = trips.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.pickup_location ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.dropoff_location ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === "all" ? trips.length : trips.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader
        title="Trips"
        subtitle="One-time custom trips by client order"
        actions={
          <>
            <Input
              placeholder="Search trips…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64"
            />
            <TripDrawer mode="create" />
          </>
        }
      />

      <div className="px-8 pt-5">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {STATUS_FILTERS.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s === "all" ? "All" : s}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  {counts[s]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={statusFilter === "all" ? "No trips yet" : `No ${statusFilter} trips`}
            description="Create a custom trip for a client order."
            action={<TripDrawer mode="create" />}
            icon={<Route className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} format={format} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trip Card ───────────────────────────────────────────────────────────────

function TripCard({ trip, format }: { trip: Trip; format: (n: number | null | undefined) => string }) {
  const deleteTrip = useDeleteTrip();

  return (
    <Card className="group flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
      {/* Date block */}
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/60 p-2 text-center">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {new Date(trip.trip_date + "T00:00:00").toLocaleDateString(undefined, { month: "short" })}
        </div>
        <div className="font-display text-2xl font-bold leading-none">
          {new Date(trip.trip_date + "T00:00:00").getDate()}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {new Date(trip.trip_date + "T00:00:00").getFullYear()}
        </div>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-base font-semibold">{trip.title}</h3>
          <StatusBadge status={trip.status} />
          {trip.base_price > 0 && (
            <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-medium text-amber">
              {format(trip.base_price)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {trip.pickup_time && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {trip.pickup_time}</span>
          )}
          {trip.pickup_location && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {trip.pickup_location}</span>
          )}
          {trip.dropoff_location && (
            <span className="flex items-center gap-1 text-muted-foreground/70">→ {trip.dropoff_location}</span>
          )}
          {trip.driver && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {trip.driver.full_name}</span>
          )}
          {trip.vehicle && (
            <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {trip.vehicle.name}</span>
          )}
          {(trip.booking_count ?? 0) > 0 && (
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {trip.total_passengers} pax · {trip.booking_count} booking{trip.booking_count !== 1 ? "s" : ""}</span>
          )}
        </div>
        {trip.description && (
          <p className="mt-1 text-xs text-muted-foreground/70 truncate max-w-xl">{trip.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <TripDrawer mode="edit" trip={trip} />
        <Button
          size="sm" variant="ghost"
          onClick={() => deleteTrip.mutate(trip.id)}
          disabled={deleteTrip.isPending}
          title="Delete trip"
        >
          {deleteTrip.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
        </Button>
        <Button asChild size="sm">
          <Link to="/trips/$tripId" params={{ tripId: trip.id }}>
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

// ── Trip Drawer (create + edit) ─────────────────────────────────────────────

function TripDrawer({ mode, trip }: { mode: "create" | "edit"; trip?: Trip }) {
  const create = useCreateTrip();
  const update = useUpdateTrip();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const [open, setOpen] = useState(false);

  const blank = {
    title: "", description: "",
    trip_date: new Date().toISOString().slice(0, 10),
    pickup_time: "", pickup_location: "", dropoff_location: "",
    vehicle_id: "", driver_id: "",
    status: "confirmed" as Trip["status"],
    base_price: "0", notes: "",
  };

  const [form, setForm] = useState(
    trip ? {
      title: trip.title,
      description: trip.description ?? "",
      trip_date: trip.trip_date,
      pickup_time: trip.pickup_time ?? "",
      pickup_location: trip.pickup_location ?? "",
      dropoff_location: trip.dropoff_location ?? "",
      vehicle_id: trip.vehicle_id ?? "",
      driver_id: trip.driver_id ?? "",
      status: trip.status,
      base_price: String(trip.base_price),
      notes: trip.notes ?? "",
    } : blank
  );

  // Auto-fill driver from vehicle
  useEffect(() => {
    if (!form.vehicle_id) return;
    const assigned = drivers.find((d) => d.vehicle_id === form.vehicle_id);
    if (assigned) setForm((f) => ({ ...f, driver_id: assigned.id }));
  }, [form.vehicle_id, drivers]);

  const driverLocked = !!form.vehicle_id && drivers.some(
    (d) => d.vehicle_id === form.vehicle_id && d.id === form.driver_id
  );

  const submit = async () => {
    if (!form.title) return;
    const payload = {
      title: form.title,
      description: form.description || null,
      trip_date: form.trip_date,
      pickup_time: form.pickup_time || null,
      pickup_location: form.pickup_location || null,
      dropoff_location: form.dropoff_location || null,
      vehicle_id: form.vehicle_id || null,
      driver_id: form.driver_id || null,
      status: form.status,
      base_price: Number(form.base_price) || 0,
      notes: form.notes || null,
    };
    if (mode === "create") await create.mutateAsync(payload);
    else if (trip) await update.mutateAsync({ id: trip.id, ...payload });
    setOpen(false);
    if (mode === "create") setForm(blank);
  };

  const isPending = create.isPending || update.isPending;
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicle_id);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === "create"
          ? <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Trip</Button>
          : <Button size="sm" variant="ghost"><Edit className="h-3.5 w-3.5" /></Button>}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New Custom Trip" : "Edit Trip"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Trip Title *">
            <Input placeholder="e.g. Airport pickup for Johnson family" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </F>
          <F label="Description">
            <Textarea rows={2} placeholder="Client notes, special instructions…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </F>

          <div className="grid grid-cols-2 gap-3">
            <F label="Date *">
              <Input type="date" value={form.trip_date} onChange={(e) => setForm({ ...form, trip_date: e.target.value })} />
            </F>
            <F label="Pickup Time">
              <Input type="time" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} />
            </F>
          </div>

          <F label="Pickup Location">
            <Input placeholder="e.g. Zvartnots Airport T1" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} />
          </F>
          <F label="Drop-off Location">
            <Input placeholder="e.g. Marriott Hotel, Yerevan" value={form.dropoff_location} onChange={(e) => setForm({ ...form, dropoff_location: e.target.value })} />
          </F>

          <F label="Vehicle">
            <Select value={form.vehicle_id} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v, driver_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} · {v.capacity} seats
                    {drivers.find((d) => d.vehicle_id === v.id) ? " 🧑‍✈️" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>

          <F label="Driver">
            {driverLocked ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1">{drivers.find((d) => d.id === form.driver_id)?.full_name}</span>
                <span className="text-xs text-amber font-medium">Auto-assigned</span>
              </div>
            ) : (
              <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choose driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}{d.status === "off_duty" ? " (off duty)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </F>

          <div className="grid grid-cols-2 gap-3">
            <F label="Price">
              <Input type="number" min={0} step={0.01} value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
            </F>
            <F label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Trip["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>

          <F label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Create Trip" : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
