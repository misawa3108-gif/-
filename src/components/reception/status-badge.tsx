import { STATUS_LABEL } from "@/lib/labels";
import type { VisitStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<VisitStatus, string> = {
  waiting: "bg-waiting/15 text-waiting-foreground",
  meeting: "bg-primary text-primary-foreground",
  expected: "bg-expected/10 text-expected",
  left: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: VisitStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
        TONE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
