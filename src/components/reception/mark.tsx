import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/lightpath.png"
      alt=""
      className={cn("size-8 object-contain", className)}
    />
  );
}
