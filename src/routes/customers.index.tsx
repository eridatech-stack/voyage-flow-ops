import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, Search, Loader2, Mail, Phone,
  CreditCard, Edit, Check, X,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomers, useUpdateCustomer, type Customer } from "@/hooks/useCustomers";

export const Route = createFileRoute("/customers/")({
  component: CustomersPage,
});

const STATUS_TABS = ["all", "pending", "paid", "refunded"] as const;

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: customers = [], isLoading } = useCustomers({
    search: search || undefined,
    payment_status: statusFilter,
  });

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === "all" ? customers.length : customers.filter((c) => c.payment_status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="All customers added across tours, transfers and trips"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone, ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-72 pl-9"
            />
          </div>
        }
      />

      {/* Status tabs */}
      <div className="px-8 pt-5">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s === "all" ? "All" : s}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  {counts[s] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={search ? "Try a different search term." : "Customers appear here once added to tours, transfers or trips."}
            icon={<Users className="h-10 w-10" />}
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Special Requests</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <CustomerRow key={c.id} customer={c} />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Summary footer */}
      {!isLoading && customers.length > 0 && (
        <div className="px-8 pb-6 text-xs text-muted-foreground">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} ·{" "}
          {customers.filter((c) => c.payment_status === "paid").length} paid ·{" "}
          {customers.filter((c) => c.payment_status === "pending").length} pending
        </div>
      )}
    </div>
  );
}

// ── Customer Row ─────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: Customer }) {
  const update = useUpdateCustomer();
  const [editing, setEditing] = useState(false);

  return (
    <>
      <TableRow key={customer.id}>
        <TableCell>
          <div className="font-medium">{customer.full_name}</div>
        </TableCell>
        <TableCell>
          <div className="space-y-0.5 text-xs">
            {customer.email && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" /> {customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" /> {customer.phone}
              </div>
            )}
            {!customer.email && !customer.phone && <span className="text-muted-foreground/50">—</span>}
          </div>
        </TableCell>
        <TableCell>
          <span className="font-mono text-xs">{customer.booking_reference ?? "—"}</span>
        </TableCell>
        <TableCell>
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
            {customer.special_requests ?? "—"}
          </span>
        </TableCell>
        <TableCell>
          <InlinePaymentStatus customer={customer} />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {String(customer.created_at).slice(0, 10)}
        </TableCell>
        <TableCell className="text-right">
          <EditCustomerDrawer customer={customer} />
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Inline Payment Status Selector ───────────────────────────────────────────

function InlinePaymentStatus({ customer }: { customer: Customer }) {
  const update = useUpdateCustomer();
  return (
    <Select
      value={customer.payment_status}
      onValueChange={(v) => update.mutate({ id: customer.id, payment_status: v as any })}
    >
      <SelectTrigger className={`h-7 w-28 border-0 px-2 text-xs font-medium shadow-none focus:ring-0 rounded-full
        ${customer.payment_status === "paid"
          ? "bg-status-confirmed/15 text-status-confirmed"
          : customer.payment_status === "refunded"
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

// ── Edit Customer Drawer ──────────────────────────────────────────────────────

function EditCustomerDrawer({ customer }: { customer: Customer }) {
  const update = useUpdateCustomer();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: customer.full_name,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    booking_reference: customer.booking_reference ?? "",
    special_requests: customer.special_requests ?? "",
    payment_status: customer.payment_status,
  });

  const submit = async () => {
    await update.mutateAsync({
      id: customer.id,
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      booking_reference: form.booking_reference || null,
      special_requests: form.special_requests || null,
      payment_status: form.payment_status,
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost">
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Edit Customer</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 py-4">
          <F label="Full Name *">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </F>
            <F label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </F>
          </div>
          <F label="Booking Reference">
            <Input value={form.booking_reference} onChange={(e) => setForm({ ...form, booking_reference: e.target.value })} />
          </F>
          <F label="Special Requests">
            <Textarea rows={3} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
          </F>
          <F label="Payment Status">
            <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v as any })}>
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
          <Button onClick={submit} disabled={!form.full_name || update.isPending}>
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
