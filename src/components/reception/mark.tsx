import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        fill="currentColor"
        className="text-primary-foreground"
        d="M16.2 6c1.7 3.4 2.1 5.8.4 9.6-2.5-3.2-3-5.8-.4-9.6z"
      />
      <path
        fill="currentColor"
        className="text-primary-foreground/80"
        d="M12.4 11.4c2 2.2 3 4.3 2.4 7.6-3-1.5-4.9-3.7-2.4-7.6z"
      />
      <path
        fill="currentColor"
        className="text-primary-foreground"
        d="M8.5 24.2h15v1.5h-15z"
      />
    </svg>
  );
}
