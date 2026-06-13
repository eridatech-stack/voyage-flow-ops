import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ScheduleDetail } from "@/components/ScheduleDetail";

export const Route = createFileRoute("/transfers/schedule/$scheduleId")({
  component: TransferScheduleDetail,
});

function TransferScheduleDetail() {
  const { scheduleId } = Route.useParams();
  const { schedules, transfers } = useStore();
  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) return <div className="p-8">Not found. <Link to="/transfers" className="text-amber underline">Back</Link></div>;
  const transfer = transfers.find((t) => t.id === schedule.parentId);
  return (
    <ScheduleDetail
      schedule={schedule}
      serviceName={transfer?.name ?? "Transfer"}
      backLink={{ to: "/transfers/$transferId", params: { transferId: schedule.parentId }, label: "Back to schedules" }}
    />
  );
}
