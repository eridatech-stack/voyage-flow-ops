import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, Clock, User, Car, Mail,
  FileText, Plus, Trash2, StickyNote, Send,
  CheckCircle2, Loader2, Edit,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScheduledTour } from "@/hooks/useSchedules";
import { useSendEmail, buildTourConfirmationEmail } from "@/hooks/useEmail";
import { useSettings } from "@/hooks/useSettings";

import {
  useTourBookings,
  useAddTourBooking,
  useRemoveTourBooking,
  useGenerateTourVoucher,
  useGenerateAllTourVouchers,
  useUpdateTourBooking,
  type TourBooking,
} from "@/hooks/useBookings";

export const Route = createFileRoute("/tours/schedule/$scheduleId")({
  component: TourScheduleDetail,
});

function TourScheduleDetail() {
  const { scheduleId } = Route.useParams();
  const { data: schedule, isLoading } = useScheduledTour(scheduleId);
  const { data: bookings = [] } = useTourBookings(scheduleId);
  const generateAll = useGenerateAllTourVouchers();
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [voucherFor, setVoucherFor] = useState<TourBooking | null>(null);
  const [emailFor, setEmailFor] = useState<TourBooking | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!schedule) {
    return <div className="p-8">Schedule not found. <Link to="/tours" className="text-amber underline">Back</Link></div>;
  }

  const totalSeats = bookings.reduce((a, b) => a + b.seat_count, 0);

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((n) => [newNote, ...n]);
    setNewNote("");
    toast.success("Note added");
  };

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-5">
        <Link
          to="/tours/$tourId"
          params={{ tourId: schedule.tour_id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to schedules
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{schedule.tour?.name ?? "Tour"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {schedule.service_date}</span>
              {schedule.departure_time && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {schedule.departure_time}</span>}
              {schedule.guide_name && <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Guide: {schedule.guide_name}</span>}
              {schedule.driver && <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Driver: {schedule.driver.full_name}</span>}
              {schedule.vehicle && <span className="inline-flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> {schedule.vehicle.name}</span>}
              <StatusBadge status={schedule.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => toast.success(`Confirmation emails queued for ${bookings.length} customers`)}
            >
              <Send className="h-3.5 w-3.5" /> Send All Confirmations
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => generateAll.mutate(scheduleId)}
              disabled={generateAll.isPending}
            >
              {generateAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Generate All Vouchers
            </Button>
            <AddCustomerDrawer scheduledTourId={scheduleId} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
        {/* Customer table */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold">
              Customers
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({totalSeats} / {schedule.max_capacity} seats)
              </span>
            </h3>
          </div>
          {bookings.length === 0 ? (
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
                  <TableHead>Voucher</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.customer.full_name}</div>
                      {b.customer.special_requests && (
                        <div className="text-xs text-muted-foreground">{b.customer.special_requests}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{b.customer.email ?? "—"}</div>
                      <div className="text-muted-foreground">{b.customer.phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{b.customer.booking_reference ?? "—"}</TableCell>
                    <TableCell>{b.seat_count}</TableCell>
                    <TableCell><StatusBadge status={b.voucher_status} /></TableCell>
                    <TableCell><StatusBadge status={b.customer.payment_status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <GenerateVoucherButton booking={b} scheduleId={scheduleId} onGenerated={() => setVoucherFor(b)} />
                        <Button size="sm" variant="ghost" onClick={() => setEmailFor(b)} title="Send email">
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <EditBookingDrawer booking={b} scheduledTourId={scheduleId} />
                        <RemoveBookingButton bookingId={b.id} scheduledTourId={scheduleId} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Notes panel */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> Operator Notes
            </h3>
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
              {schedule.notes && (
                <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground italic">
                  {schedule.notes}
                </div>
              )}
              {notes.map((n, i) => (
                <div key={i} className="rounded-md border border-border bg-muted/40 p-3 text-sm">{n}</div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <VoucherDialog
        booking={voucherFor}
        tourName={schedule.tour?.name ?? "Tour"}
        schedule={schedule}
        onClose={() => setVoucherFor(null)}
      />
      <EmailDialog
        booking={emailFor}
        tourName={schedule.tour?.name ?? "Tour"}
        schedule={schedule}
        onClose={() => setEmailFor(null)}
      />
    </div>
  );
}

// ── Add Customer Drawer ─────────────────────────────────────────────────────

function AddCustomerDrawer({ scheduledTourId }: { scheduledTourId: string }) {
  const add = useAddTourBooking();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", seat_count: "1",
    booking_reference: "", special_requests: "",
    payment_status: "pending" as "paid" | "pending" | "refunded",
  });

  const submit = async () => {
    if (!form.full_name) { toast.error("Name is required"); return; }
    await add.mutateAsync({
      scheduled_tour_id: scheduledTourId,
      seat_count: Number(form.seat_count) || 1,
      full_name: form.full_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      booking_reference: form.booking_reference || undefined,
      special_requests: form.special_requests || undefined,
      payment_status: form.payment_status,
    });
    setOpen(false);
    setForm({ full_name: "", email: "", phone: "", seat_count: "1", booking_reference: "", special_requests: "", payment_status: "pending" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Customer</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Add Customer</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Full Name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></F>
            <F label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Seats"><Input type="number" min={1} value={form.seat_count} onChange={(e) => setForm({ ...form, seat_count: e.target.value })} /></F>
            <F label="Booking Ref"><Input value={form.booking_reference} onChange={(e) => setForm({ ...form, booking_reference: e.target.value })} placeholder="auto" /></F>
          </div>
          <F label="Special Requests"><Textarea rows={2} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} /></F>
          <F label="Payment Status">
            <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v as "paid" | "pending" | "refunded" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={add.isPending}>
            {add.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Customer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Edit Booking Drawer ─────────────────────────────────────────────────────

function EditBookingDrawer({ booking, scheduledTourId }: { booking: TourBooking; scheduledTourId: string }) {
  const update = useUpdateTourBooking();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: booking.customer.full_name,
    email: booking.customer.email ?? "",
    phone: booking.customer.phone ?? "",
    seat_count: String(booking.seat_count),
    special_requests: booking.customer.special_requests ?? "",
    payment_status: booking.customer.payment_status,
  });

  const submit = async () => {
    await update.mutateAsync({
      bookingId: booking.id,
      scheduledTourId,
      customerId: booking.customer_id,
      customerUpdate: {
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        special_requests: form.special_requests || null,
        payment_status: form.payment_status,
      },
      bookingUpdate: { seat_count: Number(form.seat_count) || 1 },
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Edit Customer</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Full Name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></F>
            <F label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></F>
          </div>
          <F label="Seats"><Input type="number" min={1} value={form.seat_count} onChange={(e) => setForm({ ...form, seat_count: e.target.value })} /></F>
          <F label="Special Requests"><Textarea rows={2} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} /></F>
          <F label="Payment Status">
            <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v as "paid" | "pending" | "refunded" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Action Buttons ──────────────────────────────────────────────────────────

function GenerateVoucherButton({ booking, scheduleId, onGenerated }: { booking: TourBooking; scheduleId: string; onGenerated: () => void }) {
  const gen = useGenerateTourVoucher();
  return (
    <Button
      size="sm" variant="ghost"
      title="Generate voucher"
      disabled={gen.isPending}
      onClick={async () => {
        await gen.mutateAsync({ bookingId: booking.id, scheduledTourId: scheduleId });
        onGenerated();
      }}
    >
      {gen.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
    </Button>
  );
}

function RemoveBookingButton({ bookingId, scheduledTourId }: { bookingId: string; scheduledTourId: string }) {
  const remove = useRemoveTourBooking();
  return (
    <Button
      size="sm" variant="ghost"
      title="Remove customer"
      disabled={remove.isPending}
      onClick={() => remove.mutate({ bookingId, scheduledTourId })}
    >
      {remove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
    </Button>
  );
}

// ── Voucher Dialog ──────────────────────────────────────────────────────────

function VoucherDialog({ booking, tourName, schedule, onClose }: {
  booking: TourBooking | null;
  tourName: string;
  schedule: { service_date: string; departure_time: string | null };
  onClose: () => void;
}) {
  const printVoucher = () => {
    const win = window.open("", "_blank");
    if (!win || !booking) return;
    win.document.write(`
      <html><head><title>Voucher - ${booking.customer.full_name}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1A2744; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 20px; font-weight: 700; color: #1A2744; }
        .badge { background: #F59E0B; color: #1A2744; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; display: block; margin-bottom: 4px; }
        .field span { font-size: 14px; font-weight: 600; color: #1A2744; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; }
        .sig-line { border-bottom: 1px solid #1A2744; height: 40px; margin-top: 8px; }
        @media print { body { padding: 20px; } }
      </style></head>
      <body>
        <div class="header">
          <div>
            <div class="logo">InTravelSync</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px">Service Voucher</div>
          </div>
          <div class="badge">BOOKING CONFIRMED</div>
        </div>
        <div class="grid">
          <div class="field"><label>Guest</label><span>${booking.customer.full_name}</span></div>
          <div class="field"><label>Booking Reference</label><span>${booking.customer.booking_reference ?? "—"}</span></div>
          <div class="field"><label>Service</label><span>${tourName}</span></div>
          <div class="field"><label>Date & Time</label><span>${schedule.service_date}${schedule.departure_time ? " · " + schedule.departure_time : ""}</span></div>
          <div class="field"><label>Seats</label><span>${booking.seat_count}</span></div>
          <div class="field"><label>Payment</label><span>${booking.customer.payment_status}</span></div>
        </div>
        ${booking.customer.special_requests ? `<div class="field"><label>Special Requests</label><span>${booking.customer.special_requests}</span></div>` : ""}
        <div class="footer">
          <div style="font-size:11px;color:#64748B">Operator Signature</div>
          <div class="sig-line"></div>
        </div>
        <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
    onClose();
  };

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-status-confirmed" /> Voucher Ready
          </DialogTitle>
        </DialogHeader>
        {booking && (
          <div className="rounded-lg border-2 border-border bg-card p-8">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber font-display font-bold text-amber-foreground">iT</div>
                <div>
                  <div className="font-display text-lg font-bold">InTravelSync</div>
                  <div className="text-xs text-muted-foreground">Service Voucher</div>
                </div>
              </div>
              <div className="rounded-full bg-amber/15 px-3 py-1 text-xs font-semibold text-amber">CONFIRMED</div>
            </div>
            <div className="grid grid-cols-2 gap-6 py-6 text-sm">
              <Info label="Guest">{booking.customer.full_name}</Info>
              <Info label="Booking Reference"><span className="font-mono">{booking.customer.booking_reference ?? "—"}</span></Info>
              <Info label="Service">{tourName}</Info>
              <Info label="Date & Time">{schedule.service_date}{schedule.departure_time ? " · " + schedule.departure_time : ""}</Info>
              <Info label="Seats">{booking.seat_count}</Info>
              <Info label="Payment"><StatusBadge status={booking.customer.payment_status} /></Info>
            </div>
            {booking.customer.special_requests && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Special Requests: </span>
                {booking.customer.special_requests}
              </div>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">Operator Signature</div>
              <div className="mt-3 h-12 border-b border-border" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={printVoucher}><FileText className="h-3.5 w-3.5" /> Print / Save PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Email Dialog ────────────────────────────────────────────────────────────

function EmailDialog({ booking, tourName, schedule, onClose }: {
  booking: TourBooking | null;
  tourName: string;
  schedule: { service_date: string; departure_time: string | null };
  onClose: () => void;
}) {
  const sendEmail = useSendEmail();
  const { data: settings } = useSettings();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  if (booking && !subject) {
    const tpl = buildTourConfirmationEmail({
      customerName: booking.customer.full_name,
      tourName,
      serviceDate: schedule.service_date,
      departureTime: schedule.departure_time,
      bookingRef: booking.customer.booking_reference,
      seatCount: booking.seat_count,
      agencyName: settings?.agency_name ?? "InTravelSync",
    });
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  const handleSend = async () => {
    if (!booking?.customer.email) { toast.error("Customer has no email address"); return; }
    await sendEmail.mutateAsync({ to: booking.customer.email, subject, body });
    onClose(); setSubject(""); setBody("");
  };

  return (
    <Dialog open={!!booking} onOpenChange={(o) => { if (!o) { onClose(); setSubject(""); setBody(""); } }}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Send Email</DialogTitle></DialogHeader>
        {booking && (
          <div className="space-y-3">
            <F label="To">
              <Input value={booking.customer.email ?? "No email on file"} disabled className={!booking.customer.email ? "text-destructive" : ""} />
            </F>
            <F label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></F>
            <F label="Message"><Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} /></F>
            {!settings?.resend_api_key && (
              <div className="rounded-md border border-amber/30 bg-amber/5 p-2 text-xs text-muted-foreground">
                ⚠️ No email API key configured. Add your Resend API key in <strong>Settings → Email Configuration</strong>.
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setSubject(""); setBody(""); }}>Cancel</Button>
          <Button onClick={handleSend} disabled={sendEmail.isPending || !booking?.customer.email}>
            {sendEmail.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </Button>
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
