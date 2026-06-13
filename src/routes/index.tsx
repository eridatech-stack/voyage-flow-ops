import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Plane,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore, type Schedule } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { schedules, tours, transfers, customers } = useStore();
  const todayStr = new Date().toISOString().slice(0, 10);

  const todaysTours = schedules.filter((s) => s.kind === "tour" && s.date === todayStr);
  const todaysTransfers = schedules.filter((s) => s.kind === "transfer" && s.date === todayStr);
  const pendingVouchers = customers.filter((c) => c.voucherStatus === "Pending").length;

  const nameFor = (s: Schedule) =>
    s.kind === "tour"
      ? tours.find((t) => t.id === s.parentId)?.name ?? "Tour"
      : transfers.find((t) => t.id === s.parentId)?.name ?? "Transfer";

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today's operations at a glance"
      />
      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Today's Tours" value={todaysTours.length} icon={<MapPin className="h-4 w-4" />} accent="amber" />
          <KpiCard label="Today's Transfers" value={todaysTransfers.length} icon={<Plane className="h-4 w-4" />} accent="blue" />
          <KpiCard label="Active Customers" value={customers.length} icon={<Users className="h-4 w-4" />} accent="navy" />
          <KpiCard label="Pending Vouchers" value={pendingVouchers} icon={<FileText className="h-4 w-4" />} accent="pending" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarPanel />
          </div>
          <TodaysActivity />
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "amber" | "blue" | "navy" | "pending";
}) {
  const tone =
    accent === "amber"
      ? "bg-amber/15 text-amber"
      : accent === "blue"
      ? "bg-status-progress/15 text-status-progress"
      : accent === "navy"
      ? "bg-navy/10 text-navy"
      : "bg-status-pending/20 text-status-pending";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</div>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>{icon}</div>
      </div>
    </Card>
  );
}

function CalendarPanel() {
  const { schedules, tours, transfers } = useStore();
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(new Date());

  const nameFor = (s: Schedule) =>
    s.kind === "tour"
      ? tours.find((t) => t.id === s.parentId)?.name ?? "Tour"
      : transfers.find((t) => t.id === s.parentId)?.name ?? "Transfer";

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-display text-base font-semibold">Schedule</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shift(cursor, view, -1, setCursor)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">{label(cursor, view)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shift(cursor, view, 1, setCursor)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week" | "day")}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
              <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "month" && <MonthGrid cursor={cursor} schedules={schedules} nameFor={nameFor} />}
      {view === "week" && <WeekGrid cursor={cursor} schedules={schedules} nameFor={nameFor} />}
      {view === "day" && <DayList cursor={cursor} schedules={schedules} nameFor={nameFor} />}

      <div className="flex items-center gap-4 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber" /> Tours</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-status-progress" /> Transfers</span>
      </div>
    </Card>
  );
}

function label(d: Date, view: "month" | "week" | "day") {
  if (view === "month") return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (view === "day") return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function shift(cur: Date, view: "month" | "week" | "day", dir: number, setCursor: (d: Date) => void) {
  const n = new Date(cur);
  if (view === "month") n.setMonth(n.getMonth() + dir);
  else if (view === "week") n.setDate(n.getDate() + 7 * dir);
  else n.setDate(n.getDate() + dir);
  setCursor(n);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  return x;
}

function MonthGrid({ cursor, schedules, nameFor }: { cursor: Date; schedules: Schedule[]; nameFor: (s: Schedule) => string }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((d, i) => {
          const ds = d.toISOString().slice(0, 10);
          const inMonth = d.getMonth() === cursor.getMonth();
          const events = schedules.filter((s) => s.date === ds);
          return (
            <div
              key={i}
              className={`min-h-[88px] border-b border-r border-border p-1.5 text-xs ${inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground/60"}`}
            >
              <div className={`mb-1 flex h-5 w-5 items-center justify-center rounded text-[11px] font-medium ${ds === todayStr ? "bg-amber text-amber-foreground" : ""}`}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {events.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      e.kind === "tour"
                        ? "bg-amber/15 text-amber"
                        : "bg-status-progress/15 text-status-progress"
                    }`}
                    title={`${e.time} ${nameFor(e)}`}
                  >
                    {e.time} {nameFor(e)}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="px-1 text-[10px] text-muted-foreground">+{events.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ cursor, schedules, nameFor }: { cursor: Date; schedules: Schedule[]; nameFor: (s: Schedule) => string }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  return (
    <div className="grid grid-cols-7">
      {days.map((d, i) => {
        const ds = d.toISOString().slice(0, 10);
        const events = schedules.filter((s) => s.date === ds);
        return (
          <div key={i} className="min-h-[280px] border-r border-border p-2">
            <div className="mb-2 text-xs">
              <div className="font-medium">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className="text-muted-foreground">{d.getDate()}</div>
            </div>
            <div className="space-y-1">
              {events.map((e) => (
                <div
                  key={e.id}
                  className={`rounded p-2 text-[11px] ${
                    e.kind === "tour"
                      ? "bg-amber/15 text-amber border-l-2 border-amber"
                      : "bg-status-progress/15 text-status-progress border-l-2 border-status-progress"
                  }`}
                >
                  <div className="font-semibold">{e.time}</div>
                  <div className="truncate">{nameFor(e)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({ cursor, schedules, nameFor }: { cursor: Date; schedules: Schedule[]; nameFor: (s: Schedule) => string }) {
  const ds = cursor.toISOString().slice(0, 10);
  const events = schedules.filter((s) => s.date === ds).sort((a, b) => a.time.localeCompare(b.time));
  return (
    <div className="divide-y divide-border">
      {events.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">No events scheduled for this day.</div>
      ) : (
        events.map((e) => (
          <div key={e.id} className="flex items-center gap-4 p-4">
            <div className="w-16 text-sm font-medium">{e.time}</div>
            <div className={`h-8 w-1 rounded ${e.kind === "tour" ? "bg-amber" : "bg-status-progress"}`} />
            <div className="flex-1">
              <div className="font-medium">{nameFor(e)}</div>
              <div className="text-xs text-muted-foreground capitalize">{e.kind}</div>
            </div>
            <StatusBadge status={e.status} />
          </div>
        ))
      )}
    </div>
  );
}

function TodaysActivity() {
  const { schedules, tours, transfers } = useStore();
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = schedules.filter((s) => s.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));

  const nameFor = (s: Schedule) =>
    s.kind === "tour"
      ? tours.find((t) => t.id === s.parentId)?.name ?? "Tour"
      : transfers.find((t) => t.id === s.parentId)?.name ?? "Transfer";

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-semibold">Today's Activity</h3>
        <p className="text-xs text-muted-foreground">{today.length} services scheduled</p>
      </div>
      <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
        {today.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Nothing scheduled today.</div>
        )}
        {today.map((s) => (
          <Link
            key={s.id}
            to={s.kind === "tour" ? "/tours/schedule/$scheduleId" : "/transfers/schedule/$scheduleId"}
            params={{ scheduleId: s.id }}
            className="flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="w-12 shrink-0 text-sm font-semibold">{s.time}</div>
            <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${s.kind === "tour" ? "bg-amber" : "bg-status-progress"}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{nameFor(s)}</div>
              <div className="mt-1"><StatusBadge status={s.status} /></div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function RecentActivity() {
  const { transactions } = useStore();
  const recent = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [transactions]);
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-display text-base font-semibold">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {recent.map((t) => (
          <div key={t.id} className="flex items-center gap-4 px-5 py-3 text-sm">
            <div className="w-24 text-xs text-muted-foreground">{t.date}</div>
            <div className="flex-1">
              <div className="font-medium">{t.customer}</div>
              <div className="text-xs text-muted-foreground">{t.service} · {t.method}</div>
            </div>
            <div className="font-medium">${t.amount}</div>
            <StatusBadge status={t.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}
