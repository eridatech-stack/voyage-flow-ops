import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ScheduleDetail } from "@/components/ScheduleDetail";

export const Route = createFileRoute("/tours/schedule/$scheduleId")({
  component: TourScheduleDetail,
});

function TourScheduleDetail() {
  const { scheduleId } = Route.useParams();
  const { schedules, tours } = useStore();
  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) return <div className="p-8">Schedule not found. <Link to="/tours" className="text-amber underline">Back</Link></div>;
  const tour = tours.find((t) => t.id === schedule.parentId);
  return (
    <ScheduleDetail
      schedule={schedule}
      serviceName={tour?.name ?? "Tour"}
      backLink={{ to: "/tours/$tourId", params: { tourId: schedule.parentId }, label: "Back to schedules" }}
    />
  );
}
