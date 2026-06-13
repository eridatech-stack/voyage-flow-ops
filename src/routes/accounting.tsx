import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, DollarSign, AlertCircle, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/accounting")({
  component: Accounting,
});

function Accounting() {
  const { transactions, customers } = useStore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [service, setService] = useState("all");

  const services = Array.from(new Set(transactions.map((t) => t.service)));

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      if (status !== "all" && t.status !== status) return false;
      if (service !== "all" && t.service !== service) return false;
      return true;
    });
  }, [transactions, from, to, status, service]);

  const monthly = transactions.filter((t) => t.status === "Paid").reduce((a, t) => a + t.amount, 0);
  const unpaid = transactions.filter((t) => t.status === "Pending").reduce((a, t) => a + t.amount, 0);

  const exportCsv = () => {
    const header = "Date,Service,Customer,Amount,Method,Status\n";
    const rows = filtered.map((t) => `${t.date},${t.service},${t.customer},${t.amount},${t.method},${t.status}`).join("\n");
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
        actions={<Button size="sm" onClick={exportCsv}><Download className="h-3.5 w-3.5" /> Export CSV</Button>}
      />
      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Monthly Revenue" value={`$${monthly.toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} tone="confirmed" />
          <Stat label="Unpaid Bookings" value={`$${unpaid.toLocaleString()}`} icon={<AlertCircle className="h-4 w-4" />} tone="pending" />
          <Stat label="Customers This Month" value={`${customers.length}`} icon={<Users className="h-4 w-4" />} tone="navy" />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold mr-auto">Transactions</h3>
            <div className="flex items-center gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36" placeholder="From" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36" />
            </div>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.service}</TableCell>
                  <TableCell>{t.customer}</TableCell>
                  <TableCell className="font-medium">${t.amount}</TableCell>
                  <TableCell>{t.method}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "confirmed" | "pending" | "navy" }) {
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
