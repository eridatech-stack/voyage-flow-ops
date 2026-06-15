import { cn } from "@/lib/utils";

type AnyStatus = string;

// Maps both Supabase lowercase values and legacy Title Case values
const map: Record<string, string> = {
  // confirmed / green
  confirmed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Confirmed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  completed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Completed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  paid: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Paid: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  generated: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Generated: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  available: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  Available: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
  // pending / amber
  pending: "bg-status-pending/20 text-status-pending border-status-pending/40",
  Pending: "bg-status-pending/20 text-status-pending border-status-pending/40",
  // in progress / blue
  "in progress": "bg-status-progress/15 text-status-progress border-status-progress/30",
  "In Progress": "bg-status-progress/15 text-status-progress border-status-progress/30",
  on_trip: "bg-status-progress/15 text-status-progress border-status-progress/30",
  "On Trip": "bg-status-progress/15 text-status-progress border-status-progress/30",
  // cancelled / grey
  cancelled: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  Cancelled: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  refunded: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  Refunded: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  off_duty: "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  "Off Duty": "bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30",
  // maintenance / red
  maintenance: "bg-destructive/15 text-destructive border-destructive/30",
  Maintenance: "bg-destructive/15 text-destructive border-destructive/30",
};

function label(status: string) {
  // Convert snake_case to Title Case for display
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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
      {label(status)}
    </span>
  );
}
