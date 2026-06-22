import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Calendar, Loader2, Edit, Trash2, User, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTour } from "@/hooks/useTours";
import {
  useScheduledTours,
  useCreateScheduledTour,
  useUpdateScheduledTour,
  useDeleteScheduledTour,
  type ScheduledTour,
} from "@/hooks/useSchedules";
import { useVehicles, useDrivers, type Vehicle, type Driver } from "@/hooks/useFleet";
import { useCurrency } from "@/hooks/useCurrency";

export const Route = createFileRoute("/tours/$tourId")({
  component: TourSchedules,
});

function TourSchedules() {
  const { tourId } = Route.useParams();
  const { data: tour, isLoading: tourLoading } = useTour(tourId);
  const { format } = useCurrency();
  const { data: schedules = [], isLoading: schedulesLoading } = useScheduledTours(tourId);

  if (tourLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!tour) return <div className="p-8">Tour not found. <Link to="/tours" className="text-amber underline">Back</Link></div>;

  return (
    <div>
      <div className="border-b border-border bg-card px-8 py-5">
        <Link to="/tours" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tours
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{tour.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[tour.duration, tour.destination, tour.base_price ? `from ${format(tour.base_price)}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <NewScheduleDrawer tourId={tourId} />
        </div>
      </div>

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {schedulesLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : schedules.length === 0 ? (
            <EmptyState
              title="No schedules yet"
              description="Schedule the first departure for this tour."
              action={<NewScheduleDrawer tourId={tourId} />}
              icon={<Calendar className="h-10 w-10" />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Guide</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.service_date}</TableCell>
                    <TableCell>{s.departure_time ?? "—"}</TableCell>
                    <TableCell>{s.guide_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{s.driver?.full_name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{s.vehicle?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span>{s.total_seats ?? 0} / {s.max_capacity}</span>
                         {null}
                        {(() => {
                          const seats = s.total_seats ?? 0;
                          const cap = s.max_capacity ?? 0;
                          if (seats === 0 || cap === 0) return null;
                          if (seats > cap)
                            return <span title={`${seats} booked seats exceed capacity of ${cap}`}><AlertTriangle className="h-3.5 w-3.5 text-destructive" /></span>;
                          if (cap - seats <= 2)
                            return <span title={`Only ${cap - seats} seat(s) remaining`}><AlertTriangle className="h-3.5 w-3.5 text-amber" /></span>;
                          return null;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/tours/schedule/$scheduleId" params={{ scheduleId: s.id }}>Open</Link>
                        </Button>
                        <EditScheduleDrawer schedule={s} totalSeats={s.total_seats ?? 0} />
                        <DeleteScheduleButton id={s.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Capacity warning banner ─────────────────────────────────────────────────

function CapacityWarning({ totalSeats, vehicleCapacity, vehicleName }: {
  totalSeats: number;
  vehicleCapacity: number;
  vehicleName: string;
}) {
  if (totalSeats === 0) return null;

  const over = totalSeats > vehicleCapacity;
  const tight = !over && vehicleCapacity - totalSeats <= 2;

  if (!over && !tight) return null;

  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs ${
      over
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-amber/40 bg-amber/10 text-amber-700"
    }`}>
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div>
        {over ? (
          <><strong>Vehicle too small.</strong> {vehicleName} holds <strong>{vehicleCapacity} seats</strong> but this schedule has <strong>{totalSeats} booked seats</strong> across all customers. Choose a larger vehicle.</>
        ) : (
          <><strong>Almost full.</strong> {vehicleName} holds {vehicleCapacity} seats and {totalSeats} are already booked — only <strong>{vehicleCapacity - totalSeats} seat{vehicleCapacity - totalSeats === 1 ? "" : "s"} remaining</strong>.</>
        )}
      </div>
    </div>
  );
}
// When a vehicle is selected:
// - If the vehicle has an assigned driver → auto-fill driver, lock it
// - If not → let user pick from available drivers

function useDriverAutoFill(
  vehicles: Vehicle[],
  drivers: Driver[],
  vehicleId: string,
  setDriverId: (id: string) => void,
) {
  const [driverLocked, setDriverLocked] = useState(false);

  useEffect(() => {
    if (!vehicleId) {
      setDriverLocked(false);
      return;
    }
    const assignedDriver = drivers.find((d) => d.vehicle_id === vehicleId);
    if (assignedDriver) {
      setDriverId(assignedDriver.id);
      setDriverLocked(true);
    } else {
      setDriverLocked(false);
    }
  }, [vehicleId, drivers]);

  return { driverLocked };
}

// ── New Schedule Drawer ─────────────────────────────────────────────────────

function NewScheduleDrawer({ tourId }: { tourId: string }) {
  const createSchedule = useCreateScheduledTour();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_date: new Date().toISOString().slice(0, 10),
    departure_time: "09:00",
    guide_name: "",
    vehicle_id: "",
    driver_id: "",
    max_capacity: "16",
    status: "confirmed" as "confirmed" | "pending" | "cancelled",
    notes: "",
  });

  const { driverLocked } = useDriverAutoFill(
    vehicles, drivers, form.vehicle_id,
    (id) => setForm((f) => ({ ...f, driver_id: id }))
  );

  const handleVehicleChange = (vehicleId: string) => {
    setForm((f) => ({ ...f, vehicle_id: vehicleId, driver_id: "" }));
  };

  const submit = async () => {
    await createSchedule.mutateAsync({
      tour_id: tourId,
      service_date: form.service_date,
      departure_time: form.departure_time || null,
      guide_name: form.guide_name || null,
      vehicle_id: form.vehicle_id || null,
      driver_id: form.driver_id || null,
      max_capacity: Number(form.max_capacity) || 1,
      status: form.status,
      notes: form.notes || null,
    });
    setOpen(false);
    setForm({ service_date: new Date().toISOString().slice(0, 10), departure_time: "09:00", guide_name: "", vehicle_id: "", driver_id: "", max_capacity: "16", status: "confirmed", notes: "" });
  };

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicle_id);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Schedule</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Schedule a Departure</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="Date"><Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} /></F>
            <F label="Departure Time"><Input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} /></F>
          </div>

          <F label="Guide Name">
            <Input placeholder="Guide's full name" value={form.guide_name} onChange={(e) => setForm({ ...form, guide_name: e.target.value })} />
          </F>

          <F label="Vehicle">
            <Select value={form.vehicle_id} onValueChange={handleVehicleChange}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} · {v.capacity} seats
                    {drivers.find((d) => d.vehicle_id === v.id) ? " 🧑\u200d✈️" : ""}
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
                <span className="text-xs text-amber font-medium">Auto-assigned from vehicle</span>
              </div>
            ) : (
              <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={form.vehicle_id ? "Choose driver" : "Select vehicle first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {drivers
                    .filter((d) => d.status !== "on_trip" || d.id === form.driver_id)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}{d.status === "off_duty" ? " (off duty)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </F>

          <div className="grid grid-cols-2 gap-3">
            <F label="Max Capacity">
              <Input type="number" min={1}
                value={selectedVehicle ? String(selectedVehicle.capacity) : form.max_capacity}
                onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
                placeholder={selectedVehicle ? `Vehicle max: ${selectedVehicle.capacity}` : ""}
              />
            </F>
            <F label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "confirmed" | "pending" | "cancelled" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>

          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createSchedule.isPending}>
            {createSchedule.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create Schedule
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Edit Schedule Drawer ────────────────────────────────────────────────────

function EditScheduleDrawer({ schedule, totalSeats }: { schedule: ScheduledTour; totalSeats: number }) {
  const updateSchedule = useUpdateScheduledTour();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_date: schedule.service_date,
    departure_time: schedule.departure_time ?? "",
    guide_name: schedule.guide_name ?? "",
    vehicle_id: schedule.vehicle_id ?? "",
    driver_id: schedule.driver_id ?? "",
    max_capacity: String(schedule.max_capacity),
    status: schedule.status,
    notes: schedule.notes ?? "",
  });

  const { driverLocked } = useDriverAutoFill(
    vehicles, drivers, form.vehicle_id,
    (id) => setForm((f) => ({ ...f, driver_id: id }))
  );

  const handleVehicleChange = (vehicleId: string) => {
    setForm((f) => ({ ...f, vehicle_id: vehicleId, driver_id: "" }));
  };

  const submit = async () => {
    await updateSchedule.mutateAsync({
      id: schedule.id,
      service_date: form.service_date,
      departure_time: form.departure_time || null,
      guide_name: form.guide_name || null,
      vehicle_id: form.vehicle_id || null,
      driver_id: form.driver_id || null,
      max_capacity: Number(form.max_capacity) || 1,
      status: form.status,
      notes: form.notes || null,
    });
    setOpen(false);
  };

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicle_id);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost"><Edit className="h-3.5 w-3.5" /></Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Edit Schedule</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="Date"><Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} /></F>
            <F label="Time"><Input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} /></F>
          </div>

          <F label="Guide Name">
            <Input value={form.guide_name} onChange={(e) => setForm({ ...form, guide_name: e.target.value })} />
          </F>

          <F label="Vehicle">
            <Select value={form.vehicle_id} onValueChange={handleVehicleChange}>
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

          {selectedVehicle && (
            <CapacityWarning
              totalSeats={totalSeats}
              vehicleCapacity={selectedVehicle.capacity}
              vehicleName={selectedVehicle.name}
            />
          )}


          <F label="Driver">
            {driverLocked ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1">{drivers.find((d) => d.id === form.driver_id)?.full_name}</span>
                <span className="text-xs text-amber font-medium">Auto-assigned from vehicle</span>
              </div>
            ) : (
              <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {drivers
                    .filter((d) => d.status !== "on_trip" || d.id === form.driver_id)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                        {d.status === "off_duty" ? " (off duty)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </F>

          <div className="grid grid-cols-2 gap-3">
            <F label="Capacity">
              <Input type="number" min={1}
                value={selectedVehicle ? String(selectedVehicle.capacity) : form.max_capacity}
                onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
              />
            </F>
            <F label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "confirmed" | "pending" | "cancelled" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>

          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={updateSchedule.isPending}>
            {updateSchedule.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DeleteScheduleButton({ id }: { id: string }) {
  const del = useDeleteScheduledTour();
  return (
    <Button size="sm" variant="ghost" onClick={() => del.mutate(id)} disabled={del.isPending} title="Delete">
      {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
    </Button>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
