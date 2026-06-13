import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/PageHeader";

export const Route = createFileRoute("/tours/$tourId")({
  component: TourSchedules,
});

function TourSchedules() {
  const { tourId } = Route.useParams();
  const { tours, schedules, customers, drivers, vehicles } = useStore();
  const tour = tours.find((t) => t.id === tourId);

  if (!tour) {
    return <div className="p-8">Tour not found. <Link to="/tours" className="text-amber underline">Back</Link></div>;
  }

  const list = schedules
    .filter((s) => s.kind === "tour" && s.parentId === tourId)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <div>
      <div className="border-b border-border bg-card px-8 py-5">
        <Link to="/tours" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tours
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{tour.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tour.duration} · {tour.destination} · from ${tour.basePrice}</p>
          </div>
          <NewScheduleDrawer tourId={tourId} />
        </div>
      </div>

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {list.length === 0 ? (
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
                  <TableHead>Guide / Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => {
                  const count = customers.filter((c) => c.scheduleId === s.id).reduce((a, c) => a + c.seats, 0);
                  const driver = drivers.find((d) => d.id === s.driverId);
                  const vehicle = vehicles.find((v) => v.id === s.vehicleId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.date}</TableCell>
                      <TableCell>{s.time}</TableCell>
                      <TableCell>{driver?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>{vehicle?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>{count} / {s.capacity}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/tours/schedule/$scheduleId" params={{ scheduleId: s.id }}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

function NewScheduleDrawer({ tourId }: { tourId: string }) {
  const { addSchedule, drivers, vehicles } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    driverId: "",
    vehicleId: "",
    capacity: "16",
    notes: "",
  });

  const submit = () => {
    addSchedule({
      kind: "tour",
      parentId: tourId,
      date: form.date,
      time: form.time,
      driverId: form.driverId || undefined,
      vehicleId: form.vehicleId || undefined,
      capacity: Number(form.capacity) || 1,
      notes: form.notes,
      status: "Confirmed",
    });
    toast.success("Schedule added");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add New Schedule</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Schedule a Departure</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
            <F label="Departure Time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></F>
          </div>
          <F label="Assign Driver / Guide">
            <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose driver" /></SelectTrigger>
              <SelectContent>
                {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Assign Vehicle">
            <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.capacity} seats</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Max Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></F>
          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create Schedule</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
