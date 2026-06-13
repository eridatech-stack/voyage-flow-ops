import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Car,
  Mail,
  FileText,
  Plus,
  Trash2,
  StickyNote,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useStore, type Customer, type Schedule } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  schedule: Schedule;
  serviceName: string;
  backLink: { to: string; params: Record<string, string>; label: string };
}

export function ScheduleDetail({ schedule, serviceName, backLink }: Props) {
  const { customers, drivers, vehicles, updateCustomer, removeCustomer } = useStore();
  const guests = customers.filter((c) => c.scheduleId === schedule.id);
  const driver = drivers.find((d) => d.id === schedule.driverId);
  const vehicle = vehicles.find((v) => v.id === schedule.vehicleId);
  const [notes, setNotes] = useState<string[]>(["Customer in seat 3 requested vegetarian lunch."]);
  const [newNote, setNewNote] = useState("");
  const [voucherFor, setVoucherFor] = useState<Customer | null>(null);
  const [emailFor, setEmailFor] = useState<Customer | null>(null);

  const generateVoucher = (c: Customer) => {
    updateCustomer(c.id, { voucherStatus: "Generated" });
    setVoucherFor(c);
  };

  const generateAll = () => {
    guests.forEach((c) => updateCustomer(c.id, { voucherStatus: "Generated" }));
    toast.success(`Generated ${guests.length} vouchers`);
  };

  const sendAllEmails = () => {
    toast.success(`Confirmation emails queued for ${guests.length} customers`);
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((n) => [newNote, ...n]);
    setNewNote("");
    toast.success("Note added");
  };

  return (
    <div>
      <div className="border-b border-border bg-card px-8 py-5">
        <Link
          to={backLink.to as any}
          params={backLink.params as any}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {backLink.label}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{serviceName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {schedule.date}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {schedule.time}</span>
              <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {driver?.name ?? "Unassigned"}</span>
              <span className="inline-flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> {vehicle?.name ?? "Unassigned"}</span>
              <StatusBadge status={schedule.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={sendAllEmails}>
              <Send className="h-3.5 w-3.5" /> Send All Confirmations
            </Button>
            <Button variant="outline" size="sm" onClick={generateAll}>
              <FileText className="h-3.5 w-3.5" /> Generate All Vouchers
            </Button>
            <AddCustomerDrawer scheduleId={schedule.id} isTransfer={schedule.kind === "transfer"} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold">
              Customers <span className="ml-1 text-sm font-normal text-muted-foreground">({guests.length} / {schedule.capacity} seats)</span>
            </h3>
          </div>
          {guests.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No customers yet. Add the first booking.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Seats</TableHead>
                  {schedule.kind === "transfer" && <TableHead>Flight</TableHead>}
                  <TableHead>Voucher</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.fullName}</div>
                      {c.specialRequests && <div className="text-xs text-muted-foreground">{c.specialRequests}</div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{c.email}</div>
                      <div className="text-muted-foreground">{c.phone}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.bookingRef}</TableCell>
                    <TableCell>{c.seats}</TableCell>
                    {schedule.kind === "transfer" && (
                      <TableCell className="text-xs">
                        <div className="font-medium">{c.flightNumber ?? "—"}</div>
                        <div className="text-muted-foreground">{c.flightTime ?? ""}</div>
                      </TableCell>
                    )}
                    <TableCell><StatusBadge status={c.voucherStatus} /></TableCell>
                    <TableCell><StatusBadge status={c.paymentStatus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => generateVoucher(c)} title="Generate voucher">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEmailFor(c)} title="Send email">
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { removeCustomer(c.id); toast.success("Customer removed"); }} title="Remove">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold flex items-center gap-2"><StickyNote className="h-4 w-4" /> Operator Notes</h3>
          </div>
          <div className="space-y-3 p-4">
            <Textarea
              placeholder="Add a note about this run…"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button onClick={addNote} size="sm" className="w-full">Add note</Button>
            <div className="space-y-2 pt-2">
              {notes.map((n, i) => (
                <div key={i} className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                  {n}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <VoucherDialog customer={voucherFor} serviceName={serviceName} schedule={schedule} onClose={() => setVoucherFor(null)} />
      <EmailDialog customer={emailFor} serviceName={serviceName} schedule={schedule} onClose={() => setEmailFor(null)} />
    </div>
  );
}

function AddCustomerDrawer({ scheduleId, isTransfer }: { scheduleId: string; isTransfer: boolean }) {
  const { addCustomer } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    seats: "1",
    bookingRef: "",
    specialRequests: "",
    paymentStatus: "Pending" as "Paid" | "Pending" | "Refunded",
    flightNumber: "",
    flightTime: "",
    luggage: "0",
  });

  const submit = () => {
    if (!form.fullName) {
      toast.error("Customer name is required");
      return;
    }
    addCustomer({
      scheduleId,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      seats: Number(form.seats) || 1,
      bookingRef: form.bookingRef || `BK-${Date.now().toString().slice(-4)}`,
      specialRequests: form.specialRequests,
      paymentStatus: form.paymentStatus,
      voucherStatus: "Pending",
      flightNumber: isTransfer ? form.flightNumber : undefined,
      flightTime: isTransfer ? form.flightTime : undefined,
      luggage: isTransfer ? Number(form.luggage) || 0 : undefined,
    });
    toast.success(`${form.fullName} added`);
    setOpen(false);
    setForm({ ...form, fullName: "", email: "", phone: "", bookingRef: "", specialRequests: "", flightNumber: "", flightTime: "" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Customer</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Customer</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <Field label="Full Name *">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seats / Passengers"><Input type="number" min={1} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></Field>
            <Field label="Booking Reference"><Input value={form.bookingRef} onChange={(e) => setForm({ ...form, bookingRef: e.target.value })} placeholder="auto" /></Field>
          </div>
          {isTransfer && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Flight #"><Input value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} /></Field>
              <Field label="Flight Time"><Input type="time" value={form.flightTime} onChange={(e) => setForm({ ...form, flightTime: e.target.value })} /></Field>
              <Field label="Luggage"><Input type="number" min={0} value={form.luggage} onChange={(e) => setForm({ ...form, luggage: e.target.value })} /></Field>
            </div>
          )}
          <Field label="Special Requests">
            <Textarea rows={3} value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} />
          </Field>
          <Field label="Payment Status">
            <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v as "Paid" | "Pending" | "Refunded" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add Customer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function VoucherDialog({ customer, serviceName, schedule, onClose }: { customer: Customer | null; serviceName: string; schedule: Schedule; onClose: () => void }) {
  return (
    <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-status-confirmed" /> Voucher Generated</DialogTitle>
        </DialogHeader>
        {customer && (
          <div className="rounded-lg border-2 border-border bg-card p-8">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber font-display font-bold text-amber-foreground">iT</div>
                <div>
                  <div className="font-display text-lg font-bold">InTravelSync</div>
                  <div className="text-xs text-muted-foreground">Service Voucher</div>
                </div>
              </div>
              <div className="h-20 w-20 rounded border-2 border-dashed border-border bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground text-center">QR<br/>CODE</div>
            </div>
            <div className="grid grid-cols-2 gap-6 py-6 text-sm">
              <Info label="Guest">{customer.fullName}</Info>
              <Info label="Booking Reference"><span className="font-mono">{customer.bookingRef}</span></Info>
              <Info label="Service">{serviceName}</Info>
              <Info label="Date & Time">{schedule.date} · {schedule.time}</Info>
              <Info label="Passengers">{customer.seats}</Info>
              <Info label="Payment">{customer.paymentStatus}</Info>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">Operator Signature</div>
              <div className="mt-3 h-12 border-b border-border" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { toast.success("Voucher downloaded"); onClose(); }}>Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}

function EmailDialog({ customer, serviceName, schedule, onClose }: { customer: Customer | null; serviceName: string; schedule: Schedule; onClose: () => void }) {
  const defaultSubject = customer ? `Your booking confirmation: ${serviceName}` : "";
  const defaultBody = customer
    ? `Dear ${customer.fullName},\n\nThank you for booking ${serviceName} with InTravelSync.\n\nDate: ${schedule.date}\nTime: ${schedule.time}\nBooking Reference: ${customer.bookingRef}\n\nWe look forward to welcoming you.\n\nBest regards,\nInTravelSync Team`
    : "";
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  // Reset when customer changes
  const lastIdRef = (EmailDialog as any)._lastId ?? { current: null };
  (EmailDialog as any)._lastId = lastIdRef;
  if (customer && lastIdRef.current !== customer.id) {
    lastIdRef.current = customer.id;
    queueMicrotask(() => {
      setSubject(`Your booking confirmation: ${serviceName}`);
      setBody(`Dear ${customer.fullName},\n\nThank you for booking ${serviceName} with InTravelSync.\n\nDate: ${schedule.date}\nTime: ${schedule.time}\nBooking Reference: ${customer.bookingRef}\n\nWe look forward to welcoming you.\n\nBest regards,\nInTravelSync Team`);
    });
  }

  return (
    <Dialog open={!!customer} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>
        {customer && (
          <div className="space-y-3">
            <Field label="To"><Input value={customer.email} disabled /></Field>
            <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
            <Field label="Message"><Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { toast.success("Email sent"); onClose(); }}>
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
