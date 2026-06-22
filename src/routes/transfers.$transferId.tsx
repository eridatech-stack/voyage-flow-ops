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
import { useTransfer } from "@/hooks/useTransfers";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useScheduledTransfers,
  useCreateScheduledTransfer,
  useUpdateScheduledTransfer,
  type ScheduledTransfer,
} from "@/hooks/useSchedules";
import { useVehicles, useDrivers } from "@/hooks/useFleet";

export const Route = createFileRoute("/transfers/$transferId")({
  component: TransferSchedules,
});

function TransferSchedules() {
  const { transferId } = Route.useParams();
  const { data: transfer, isLoading: transferLoading } = useTransfer(transferId);
  const { format } = useCurrency();
  const { data: schedules = [], isLoading: schedulesLoading } = useScheduledTransfers(transferId);

  if (transferLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!transfer) {
    return <div className="p-8">Transfer not found. <Link to="/transfers" className="text-amber underline">Back</Link></div>;
  }

  return (
    <div>
      <div className="border-b border-border bg-card px-8 py-5">
        <Link to="/transfers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to transfers
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{transfer.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[transfer.origin, transfer.destination].filter(Boolean).join(" → ")}
              {transfer.base_price ? ` · from ${format(transfer.base_price)}` : ""}
            </p>
          </div>
          <NewScheduleDrawer transferId={transferId} />
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
              description="Schedule the first transfer pickup for this route."
              action={<NewScheduleDrawer transferId={transferId} />}
              icon={<Calendar className="h-10 w-10" />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.service_date}</TableCell>
                    <TableCell>{s.pickup_time ?? "—"}</TableCell>
                    <TableCell className="text-sm">{s.pickup_location ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{s.driver?.full_name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{s.vehicle?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{s.booking_count ?? 0}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/transfers/schedule/$scheduleId" params={{ scheduleId: s.id }}>Open</Link>
                        </Button>
                        <EditScheduleDrawer schedule={s} />
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

function NewScheduleDrawer({ transferId }: { transferId: string }) {
  const create = useCreateScheduledTransfer();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_date: new Date().toISOString().slice(0, 10),
    pickup_time: "10:00",
    pickup_location: "",
    dropoff_location: "",
    driver_id: "",
    vehicle_id: "",
    status: "confirmed" as "confirmed" | "pending" | "cancelled",
    notes: "",
  });

  const submit = async () => {
    await create.mutateAsync({
      transfer_id: transferId,
      service_date: form.service_date,
      pickup_time: form.pickup_time || null,
      pickup_location: form.pickup_location || null,
      dropoff_location: form.dropoff_location || null,
      driver_id: form.driver_id || null,
      vehicle_id: form.vehicle_id || null,
      status: form.status,
      notes: form.notes || null,
    });
    setOpen(false);
    setForm({ ...form, pickup_location: "", dropoff_location: "", notes: "", driver_id: "", vehicle_id: "" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Schedule Transfer</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Schedule Transfer</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="Date"><Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} /></F>
            <F label="Pickup Time"><Input type="time" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} /></F>
          </div>
          <F label="Pickup Location">
            <Input placeholder="e.g. Zvartnots Airport, Terminal 1" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} />
          </F>
          <F label="Drop-off Location">
            <Input placeholder="e.g. Marriott Hotel, Yerevan" value={form.dropoff_location} onChange={(e) => setForm({ ...form, dropoff_location: e.target.value })} />
          </F>
          <F label="Driver">
            <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose driver" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create Schedule
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditScheduleDrawer({ schedule }: { schedule: ScheduledTransfer }) {
  const update = useUpdateScheduledTransfer();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_date: schedule.service_date,
    pickup_time: schedule.pickup_time ?? "",
    pickup_location: schedule.pickup_location ?? "",
    dropoff_location: schedule.dropoff_location ?? "",
    driver_id: schedule.driver_id ?? "",
    vehicle_id: schedule.vehicle_id ?? "",
    status: schedule.status,
    notes: schedule.notes ?? "",
  });

  const submit = async () => {
    await update.mutateAsync({
      id: schedule.id,
      service_date: form.service_date,
      pickup_time: form.pickup_time || null,
      pickup_location: form.pickup_location || null,
      dropoff_location: form.dropoff_location || null,
      driver_id: form.driver_id || null,
      vehicle_id: form.vehicle_id || null,
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
            <F label="Time"><Input type="time" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} /></F>
          </div>
          <F label="Pickup Location">
            <Input value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} />
          </F>
          <F label="Drop-off Location">
            <Input value={form.dropoff_location} onChange={(e) => setForm({ ...form, dropoff_location: e.target.value })} />
          </F>
          <F label="Driver">
            <Select value={form.driver_id} onValueChange={(v) => setForm({ ...form, driver_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose driver" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
