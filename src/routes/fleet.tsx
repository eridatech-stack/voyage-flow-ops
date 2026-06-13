import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";
import { useStore } from "@/lib/store";
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

function VehicleTable() {
  const { vehicles, drivers } = useStore();
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-semibold">Vehicles</h3>
        <NewVehicle />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Plate</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.name}</TableCell>
              <TableCell>{v.type}</TableCell>
              <TableCell className="font-mono text-xs">{v.plate}</TableCell>
              <TableCell>{v.capacity}</TableCell>
              <TableCell><StatusBadge status={v.status} /></TableCell>
              <TableCell>{drivers.find((d) => d.id === v.assignedDriverId)?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => toast.info("Edit vehicle")}><Edit className="h-3.5 w-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function DriverTable() {
  const { drivers, vehicles } = useStore();
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-semibold">Drivers</h3>
        <NewDriver />
      </div>
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
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell className="text-sm">{d.phone}</TableCell>
              <TableCell>{d.license}</TableCell>
              <TableCell><StatusBadge status={d.status} /></TableCell>
              <TableCell>{vehicles.find((v) => v.id === d.assignedVehicleId)?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => toast.info("Edit driver")}><Edit className="h-3.5 w-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function NewVehicle() {
  const { addVehicle } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Van" as "Van" | "Bus" | "Sedan", plate: "", capacity: "12", status: "Available" as "Available" | "On Trip" | "Maintenance" });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Vehicle</Button></SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Add Vehicle</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
          <F label="Type">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "Van" | "Bus" | "Sedan" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Van">Van</SelectItem><SelectItem value="Bus">Bus</SelectItem><SelectItem value="Sedan">Sedan</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="Plate Number"><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></F>
          <F label="Capacity"><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { if (!form.name) return toast.error("Name required"); addVehicle({ ...form, capacity: Number(form.capacity) || 1 }); toast.success("Vehicle added"); setOpen(false); }}>Add</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function NewDriver() {
  const { addDriver } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", license: "", status: "Available" as "Available" | "On Trip" | "Off Duty" });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Driver</Button></SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Add Driver</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
          <F label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
          <F label="License Type"><Input placeholder="Cat. D" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { if (!form.name) return toast.error("Name required"); addDriver(form); toast.success("Driver added"); setOpen(false); }}>Add</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
