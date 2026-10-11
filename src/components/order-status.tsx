import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Received",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Picked up",
  cancelled: "Cancelled",
};

const tone: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  preparing: "bg-primary/20 text-primary",
  ready: "bg-palm/20 text-palm",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("rounded-full px-2.5 py-1 font-display text-xs font-bold uppercase", tone[status])}>{STATUS_LABEL[status] ?? status}</span>;
}
