import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useVehicles, useCreateVehicle, useUpdateVehicle,
  useDrivers, useCreateDriver, useUpdateDriver,
  type Vehicle, type Driver,
} from "@/hooks/useFleet";

export const Route = createFileRoute("/fleet")({
  component: Fleet,
});

function Fleet() {
  return (
    <div>
      <PageHeader title="Fleet & Drivers" subtitle="Vehicles and drivers available for assignment" />
      <div className="p-8">
        <Tabs defaultValue="vehicles">
          <TabsList>
            <TabsTrigger value="vehicles">Fleet (Vehicles)</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
          </TabsList>
          <TabsContent value="vehicles" className="mt-5"><VehicleTable /></TabsContent>
          <TabsContent value="drivers" className="mt-5"><DriverTable /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Vehicles ────────────────────────────────────────────────────────────────

function VehicleTable() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: drivers = [] } = useDrivers();

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-semibold">Vehicles</h3>
        <VehicleDrawer mode="create" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell className="capitalize">{v.type}</TableCell>
                <TableCell className="font-mono text-xs">{v.plate_number}</TableCell>
                <TableCell>{v.capacity}</TableCell>
                <TableCell><StatusBadge status={v.status} /></TableCell>
                <TableCell className="text-right">
                  <VehicleDrawer mode="edit" vehicle={v} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function VehicleDrawer({ mode, vehicle }: { mode: "create" | "edit"; vehicle?: Vehicle }) {
  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: vehicle?.name ?? "",
    type: vehicle?.type ?? "van",
    plate_number: vehicle?.plate_number ?? "",
    capacity: String(vehicle?.capacity ?? 12),
    status: vehicle?.status ?? "available",
  });

  const submit = async () => {
    const payload = {
      name: form.name,
      type: form.type as Vehicle["type"],
      plate_number: form.plate_number,
      capacity: Number(form.capacity) || 1,
      status: form.status as Vehicle["status"],
    };
    if (mode === "create") await create.mutateAsync(payload);
    else if (vehicle) await update.mutateAsync({ id: vehicle.id, ...payload });
    setOpen(false);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === "create"
          ? <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Vehicle</Button>
          : <Button size="sm" variant="ghost"><Edit className="h-3.5 w-3.5" /></Button>}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{mode === "create" ? "Add Vehicle" : "Edit Vehicle"}</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
          <F label="Type">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="minibus">Minibus</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Plate Number"><Input value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} /></F>
          <F label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></F>
          <F label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Add Vehicle" : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Drivers ─────────────────────────────────────────────────────────────────

function DriverTable() {
  const { data: drivers = [], isLoading } = useDrivers();
  const { data: vehicles = [] } = useVehicles();

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-semibold">Drivers</h3>
        <DriverDrawer mode="create" vehicles={vehicles} />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.full_name}</TableCell>
                <TableCell className="text-sm">{d.phone ?? "—"}</TableCell>
                <TableCell>{d.license_type ?? "—"}</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
                <TableCell>{d.vehicle?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right">
                  <DriverDrawer mode="edit" driver={d} vehicles={vehicles} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function DriverDrawer({ mode, driver, vehicles }: { mode: "create" | "edit"; driver?: Driver; vehicles: Vehicle[] }) {
  const create = useCreateDriver();
  const update = useUpdateDriver();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: driver?.full_name ?? "",
    phone: driver?.phone ?? "",
    license_type: driver?.license_type ?? "",
    status: driver?.status ?? "available",
    vehicle_id: driver?.vehicle_id ?? "",
  });

  const submit = async () => {
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      license_type: form.license_type || null,
      status: form.status as Driver["status"],
      vehicle_id: form.vehicle_id || null,
    };
    if (mode === "create") await create.mutateAsync(payload);
    else if (driver) await update.mutateAsync({ id: driver.id, ...payload });
    setOpen(false);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {mode === "create"
          ? <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Driver</Button>
          : <Button size="sm" variant="ghost"><Edit className="h-3.5 w-3.5" /></Button>}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{mode === "create" ? "Add Driver" : "Edit Driver"}</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Full Name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></F>
          <F label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
          <F label="License Type"><Input placeholder="e.g. Cat. D" value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })} /></F>
          <F label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Assigned Vehicle">
            <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.plate_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.full_name || isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "create" ? "Add Driver" : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
