import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/transfers/$transferId")({
  component: TransferSchedules,
});

function TransferSchedules() {
  const { transferId } = Route.useParams();
  const { transfers, schedules, customers, drivers, vehicles } = useStore();
  const transfer = transfers.find((t) => t.id === transferId);
  if (!transfer) return <div className="p-8">Transfer not found. <Link to="/transfers" className="text-amber underline">Back</Link></div>;

  const list = schedules
    .filter((s) => s.kind === "transfer" && s.parentId === transferId)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <div>
      <div className="border-b border-border bg-card px-8 py-5">
        <Link to="/transfers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to transfers
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{transfer.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{transfer.pickup} → {transfer.dropoff}</p>
          </div>
          <NewScheduleDrawer transferId={transferId} />
        </div>
      </div>

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {list.length === 0 ? (
            <EmptyState
              title="No transfers scheduled"
              description="Add the first scheduled pickup for this route."
              action={<NewScheduleDrawer transferId={transferId} />}
              icon={<Calendar className="h-10 w-10" />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => {
                  const count = customers.filter((c) => c.scheduleId === s.id).reduce((a, c) => a + c.seats, 0);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.date}</TableCell>
                      <TableCell>{s.time}</TableCell>
                      <TableCell>{drivers.find((d) => d.id === s.driverId)?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>{vehicles.find((v) => v.id === s.vehicleId)?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>{count} / {s.capacity}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/transfers/schedule/$scheduleId" params={{ scheduleId: s.id }}>Open</Link>
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

function NewScheduleDrawer({ transferId }: { transferId: string }) {
  const { addSchedule, drivers, vehicles } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    driverId: "",
    vehicleId: "",
    capacity: "4",
    notes: "",
  });

  const submit = () => {
    addSchedule({
      kind: "transfer",
      parentId: transferId,
      date: form.date,
      time: form.time,
      driverId: form.driverId || undefined,
      vehicleId: form.vehicleId || undefined,
      capacity: Number(form.capacity) || 1,
      notes: form.notes,
      status: "Confirmed",
    });
    toast.success("Transfer scheduled");
    setOpen(false);
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
            <F label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
            <F label="Pickup Time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></F>
          </div>
          <F label="Driver">
            <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose driver" /></SelectTrigger>
              <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Vehicle">
            <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.capacity} seats</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></F>
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
