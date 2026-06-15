import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Calendar, Loader2, Edit, Trash2 } from "lucide-react";
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
import { useVehicles } from "@/hooks/useFleet";

export const Route = createFileRoute("/tours/$tourId")({
  component: TourSchedules,
});

function TourSchedules() {
  const { tourId } = Route.useParams();
  const { data: tour, isLoading: tourLoading } = useTour(tourId);
  const { data: schedules = [], isLoading: schedulesLoading } = useScheduledTours(tourId);

  if (tourLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!tour) {
    return <div className="p-8">Tour not found. <Link to="/tours" className="text-amber underline">Back</Link></div>;
  }

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
              {[tour.duration, tour.destination, tour.base_price ? `from $${tour.base_price}` : null]
                .filter(Boolean).join(" · ")}
            </p>
          </div>
          <NewScheduleDrawer tourId={tourId} />
        </div>
      </div>

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {schedulesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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
                    <TableCell>{s.guide_name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{s.vehicle?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{s.booking_count ?? 0} / {s.max_capacity}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/tours/schedule/$scheduleId" params={{ scheduleId: s.id }}>Open</Link>
                        </Button>
                        <EditScheduleDrawer schedule={s} />
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

// ── New Schedule Drawer ─────────────────────────────────────────────────────

function NewScheduleDrawer({ tourId }: { tourId: string }) {
  const createSchedule = useCreateScheduledTour();
  const { data: vehicles = [] } = useVehicles();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_date: new Date().toISOString().slice(0, 10),
    departure_time: "09:00",
    guide_name: "",
    vehicle_id: "",
    max_capacity: "16",
    status: "confirmed" as "confirmed" | "pending" | "cancelled",
    notes: "",
  });

  const submit = async () => {
    await createSchedule.mutateAsync({
      tour_id: tourId,
      service_date: form.service_date,
      departure_time: form.departure_time || null,
      guide_name: form.guide_name || null,
      vehicle_id: form.vehicle_id || null,
      max_capacity: Number(form.max_capacity) || 1,
      status: form.status,
      notes: form.notes || null,
    });
    setOpen(false);
    setForm({ ...form, guide_name: "", notes: "", vehicle_id: "" });
  };

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
            <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.capacity} seats</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Max Capacity"><Input type="number" min={1} value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} /></F>
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

function EditScheduleDrawer({ schedule }: { schedule: ScheduledTour }) {
  const updateSchedule = useUpdateScheduledTour();
  const { data: vehicles = [] } = useVehicles();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_date: schedule.service_date,
    departure_time: schedule.departure_time ?? "",
    guide_name: schedule.guide_name ?? "",
    vehicle_id: schedule.vehicle_id ?? "",
    max_capacity: String(schedule.max_capacity),
    status: schedule.status,
    notes: schedule.notes ?? "",
  });

  const submit = async () => {
    await updateSchedule.mutateAsync({
      id: schedule.id,
      service_date: form.service_date,
      departure_time: form.departure_time || null,
      guide_name: form.guide_name || null,
      vehicle_id: form.vehicle_id || null,
      max_capacity: Number(form.max_capacity) || 1,
      status: form.status,
      notes: form.notes || null,
    });
    setOpen(false);
  };

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
            <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.capacity} seats</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Capacity"><Input type="number" min={1} value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} /></F>
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
    <Button size="sm" variant="ghost" onClick={() => del.mutate(id)} disabled={del.isPending} title="Delete schedule">
      {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
    </Button>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
