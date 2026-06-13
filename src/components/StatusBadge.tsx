import { cn } from "@/lib/utils";
import type { Status, PaymentStatus, VoucherStatus } from "@/lib/store";

type AnyStatus = Status | PaymentStatus | VoucherStatus | string;

const map: Record<string, string> = {
  Confirmed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Completed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Paid: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Generated: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Available: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Pending: "bg-status-pending/20 text-status-pending border-status-pending/40",
  "In Progress": "bg-status-progress/15 text-status-progress border-status-progress/30",
  "On Trip": "bg-status-progress/15 text-status-progress border-status-progress/30",
  Cancelled: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  Refunded: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  Maintenance: "bg-destructive/15 text-destructive border-destructive/30",
  "Off Duty": "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        map[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
