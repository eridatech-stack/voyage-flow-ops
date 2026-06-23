import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, DollarSign, AlertCircle, TrendingUp, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountingEntries, useAccountingSummary, useCreateAccountingEntry, useUpdateAccountingEntry } from "@/hooks/useAccounting";
import { useCurrency } from "@/hooks/useCurrency";

export const Route = createFileRoute("/accounting")({
  component: Accounting,
});

function Accounting() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [serviceType, setServiceType] = useState("all");

  const { format, code: currencyCode } = useCurrency();
  const { data: entries = [], isLoading } = useAccountingEntries({ from, to, status, service_type: serviceType });
  const { data: summary } = useAccountingSummary();

  const exportCsv = () => {
    const header = "Date,Service Type,Customer,Amount,Method,Status,Notes\n";
    const rows = entries
      .map((e) => `${e.entry_date},${e.service_type},${e.customer?.full_name ?? ""},${e.amount},${e.payment_method ?? ""},${e.status},${e.notes ?? ""}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div>
      <PageHeader
        title="Accounting"
        subtitle="Revenue, transactions, and payments"
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <AddEntryDrawer />
          </>
        }
      />
      <div className="space-y-6 p-8">
        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={format(summary?.totalRevenue ?? 0)}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="confirmed"
          />
          <StatCard
            label="Unpaid Bookings"
            value={format(summary?.unpaidAmount ?? 0)}
            icon={<AlertCircle className="h-4 w-4" />}
            tone="pending"
          />
          <StatCard
            label="Total Entries"
            value={String(summary?.totalEntries ?? 0)}
            icon={<DollarSign className="h-4 w-4" />}
            tone="navy"
          />
        </div>

        {/* Filters + table */}
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold mr-auto">Transactions</h3>
            <div className="flex items-center gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36" />
            </div>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="tour">Tours</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No entries found for the selected filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{e.entry_date}</TableCell>
                    <TableCell className="capitalize">{e.service_type}</TableCell>
                    <TableCell>{e.customer?.full_name ?? "—"}</TableCell>
                    <TableCell className="font-medium">{format(e.amount)}</TableCell>
                    <TableCell>{e.payment_method ?? "—"}</TableCell>
                    <TableCell><InlineStatusSelect entry={e} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{e.notes ?? "—"}</TableCell>
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


// ── Inline Status Select ────────────────────────────────────────────────────

function InlineStatusSelect({ entry }: { entry: { id: string; status: string } }) {
  const update = useUpdateAccountingEntry();
  return (
    <Select
      value={entry.status}
      onValueChange={(v) =>
        update.mutate({ id: entry.id, status: v as "paid" | "pending" | "refunded" })
      }
    >
      <SelectTrigger className={`h-7 w-28 border-0 px-2 text-xs font-medium shadow-none focus:ring-0 rounded-full
        ${entry.status === "paid"
          ? "bg-status-confirmed/15 text-status-confirmed"
          : entry.status === "refunded"
          ? "bg-status-cancelled/15 text-status-cancelled"
          : "bg-status-pending/20 text-status-pending"
        }`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="refunded">Refunded</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Add Entry Drawer ────────────────────────────────────────────────────────

function AddEntryDrawer() {
  const { code: currencyCode } = useCurrency();
  const create = useCreateAccountingEntry();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_type: "tour" as "tour" | "transfer" | "trip",
    amount: "",
    payment_method: "cash",
    status: "paid" as "paid" | "pending" | "refunded",
    entry_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const submit = async () => {
    if (!form.amount) { toast.error("Amount is required"); return; }
    await create.mutateAsync({
      service_type: form.service_type as "tour" | "transfer",
      amount: Number(form.amount),
      payment_method: form.payment_method,
      status: form.status,
      entry_date: form.entry_date,
      notes: form.notes || null,
      booking_id: null,
      customer_id: null,
    });
    setOpen(false);
    setForm({ ...form, amount: "", notes: "" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Entry</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Add Accounting Entry</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="Service Type">
              <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v as "tour" | "transfer" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tour">Tour</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Date"><Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></F>
          </div>
          <F label={`Amount (${currencyCode}) *`}><Input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Payment Method">
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "paid" | "pending" | "refunded" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>
          <F label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Entry
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({ label, value, icon, tone }: {
  label: string; value: string; icon: React.ReactNode;
  tone: "confirmed" | "pending" | "navy";
}) {
  const t = tone === "confirmed" ? "bg-status-confirmed/15 text-status-confirmed"
    : tone === "pending" ? "bg-status-pending/20 text-status-pending"
    : "bg-navy/10 text-navy";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${t}`}>{icon}</div>
      </div>
    </Card>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
